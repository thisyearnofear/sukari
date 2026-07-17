/**
 * useCoach — LLM coach with local selectMission fallback.
 * Never blocks gameplay; timeouts fall back to rules.
 */
import { useCallback, useState } from 'react';
import { fetchCoachChat, fetchCoachMission } from '@/domain/coach';
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
          'Local Alchemist: mission chosen from your programme templates (offline-safe).',
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
      setIsLoading(true);
      setError(null);
      setChatReply(null);
      try {
        const remote = await fetchCoachChat({
          message,
          mission: progress.activeMission,
          signalMinimized: snapshot?.minimized,
          userMode: progress.userMode,
        });
        if (remote?.ok && remote.reply) {
          setChatReply(remote.reply);
          track('coach_chat_ok', { escalate: !!remote.escalate, refused: !!remote.refused });
          return remote.reply;
        }
        const mission = progress.activeMission;
        const fallback = mission
          ? `Today’s ask: ${mission.realWorldAction} I can’t reach the cloud Alchemist right now — start with that one step.`
          : 'Practice one short battle, then pick one real-world habit for tonight.';
        setChatReply(fallback);
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

  return {
    insights,
    chatReply,
    isLoading,
    error,
    refreshMission,
    ask,
    activeMission: progress.activeMission as ProgrammeMission | null,
  };
}
