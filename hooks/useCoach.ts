/**
 * useCoach — LLM coach with local selectMission fallback.
 * Never blocks gameplay; timeouts fall back to rules.
 *
 * Supports streaming chat (token-by-token display) and session memory
 * (last 6 messages sent as context for follow-up questions).
 */
import { useCallback, useRef, useState } from 'react';
import { fetchCoachChatStream, fetchCoachMission } from '@/domain/coach';
import {
  dateKeyFrom,
  getTemplateById,
  missionFromTemplate,
  ProgrammeMission,
  selectMission,
} from '@/domain/programme';
import type { SignalSnapshot } from '@/domain/signals';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { track } from '@/utils/analytics';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useCoach() {
  const {
    progress,
    setActiveMissionFromCoach,
    ensureTodayMission,
  } = usePlayerProgressContext();
  const [insights, setInsights] = useState<string[]>([]);
  const [chatReply, setChatReply] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Ref mirror of messages for use in async callbacks without stale closures.
  const messagesRef = useRef<ChatMessage[]>([]);

  const refreshMission = useCallback(
    async (snapshot?: SignalSnapshot | null) => {
      setIsLoading(true);
      setError(null);
      try {
        const remote = await fetchCoachMission({
          userMode: progress.userMode,
          signalMinimized: snapshot?.minimized || {
            connected: false,
            trend: null,
            band: 'unknown',
            source: 'none',
          },
          adherenceWeek: progress.adherenceWeek,
          lastMissionTemplateId: progress.activeMission?.templateId,
        });

        if (remote?.ok && remote.templateId) {
          const template = getTemplateById(remote.templateId);
          if (template) {
            let mission = missionFromTemplate(template, dateKeyFrom(), 'coach');
            if (remote.realmCopy) mission = { ...mission, realmCopy: remote.realmCopy };
            if (remote.realWorldAction)
              mission = { ...mission, realWorldAction: remote.realWorldAction };
            if (remote.transferHint)
              mission = { ...mission, transferHint: remote.transferHint };
            if (remote.caregiverSupportAction)
              mission = { ...mission, caregiverSupportAction: remote.caregiverSupportAction };
            setActiveMissionFromCoach(mission);
            setInsights(remote.insights || []);
            track('coach_mission_remote', { template_id: mission.templateId });
            return mission;
          }
        }

        ensureTodayMission(snapshot);
        const local = selectMission({
          userMode: progress.userMode,
          snapshot,
          activeMission: progress.activeMission,
          missionHistory: progress.missionHistory,
        });
        setInsights([
          'Coach offline — mission chosen from your programme templates.',
        ]);
        track('coach_mission_fallback', { template_id: local.templateId });
        return local;
      } catch (e: any) {
        setError(e?.message || 'Coach unavailable');
        ensureTodayMission(snapshot);
        return progress.activeMission;
      } finally {
        setIsLoading(false);
      }
    },
    [
      progress.userMode,
      progress.adherenceWeek,
      progress.activeMission,
      progress.missionHistory,
      setActiveMissionFromCoach,
      ensureTodayMission,
    ],
  );

  const ask = useCallback(
    async (message: string, snapshot?: SignalSnapshot | null) => {
      if (!message.trim()) return null;
      setIsLoading(true);
      setError(null);
      setChatReply('');

      // Add user message to conversation immediately.
      const userMsg: ChatMessage = { role: 'user', content: message };
      const updatedMessages = [...messagesRef.current, userMsg];
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);

      // Build history for the worker (last 6 messages, excluding the current one
      // which the worker prepends to the user content).
      const history = updatedMessages.slice(-7, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const fullReply = await fetchCoachChatStream(
          {
            message,
            mission: progress.activeMission,
            signalMinimized: snapshot?.minimized,
            userMode: progress.userMode,
            history,
          },
          (chunk) => {
            setChatReply((prev) => (prev ?? '') + chunk);
          },
        );

        if (fullReply) {
          setChatReply(fullReply);
          const assistantMsg: ChatMessage = { role: 'assistant', content: fullReply };
          const withReply = [...messagesRef.current, assistantMsg];
          messagesRef.current = withReply;
          setMessages(withReply);
          track('coach_chat_stream_ok');
          return fullReply;
        }

        // Fallback when stream fails entirely.
        const mission = progress.activeMission;
        const fallback = mission
          ? `Today's ask: ${mission.realWorldAction} I can't reach the cloud coach right now — start with that one step.`
          : 'Pick one real-world habit for tonight and try it after your next meal.';
        setChatReply(fallback);
        const fallbackMsg: ChatMessage = { role: 'assistant', content: fallback };
        const withFallback = [...messagesRef.current, fallbackMsg];
        messagesRef.current = withFallback;
        setMessages(withFallback);
        track('coach_chat_fallback');
        return fallback;
      } catch (e: any) {
        setError(e?.message || 'Coach chat failed');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [progress.activeMission, progress.userMode],
  );

  const clearChat = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
    setChatReply(null);
  }, []);

  return {
    insights,
    chatReply,
    isLoading,
    error,
    messages,
    refreshMission,
    ask,
    clearChat,
    activeMission: progress.activeMission as ProgrammeMission | null,
  };
}
