"use client";

import { useEffect, useMemo, useState } from "react";

type BonzoPipelineOption = {
  id: string;
  name: string;
};

type BonzoStageOption = {
  id: string;
  pipeline_id: string;
  name: string;
};

export type BonzoStageSelection = {
  pipelineId?: string | null;
  pipelineName?: string | null;
  stageId?: string | null;
  stageName?: string | null;
};

type BonzoStageSelectorProps = {
  initialSelection?: BonzoStageSelection;
};

export function BonzoStageSelector({ initialSelection }: BonzoStageSelectorProps) {
  const [pipelines, setPipelines] = useState<BonzoPipelineOption[]>([]);
  const [stages, setStages] = useState<BonzoStageOption[]>([]);
  const [pipelineId, setPipelineId] = useState(initialSelection?.pipelineId ?? "");
  const [stageId, setStageId] = useState(initialSelection?.stageId ?? "");
  const [pipelineName, setPipelineName] = useState(initialSelection?.pipelineName ?? "");
  const [stageName, setStageName] = useState(initialSelection?.stageName ?? "");
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [loadingStages, setLoadingStages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPipelines() {
      setLoadingPipelines(true);
      setError(null);

      try {
        const response = await fetch("/api/admin/bonzo/pipelines", { cache: "no-store" });
        const payload = (await response.json()) as {
          pipelines?: BonzoPipelineOption[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load Bonzo pipelines.");
        }

        if (!cancelled) {
          setPipelines(payload.pipelines ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load Bonzo pipelines.");
        }
      } finally {
        if (!cancelled) {
          setLoadingPipelines(false);
        }
      }
    }

    loadPipelines();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const selectedPipeline = pipelines.find((pipeline) => pipeline.id === pipelineId);
    if (selectedPipeline) {
      setPipelineName(selectedPipeline.name);
    } else if (!pipelineId) {
      setPipelineName("");
    }
  }, [pipelineId, pipelines]);

  useEffect(() => {
    if (!pipelineId) {
      setStages([]);
      setStageId("");
      setStageName("");
      return;
    }

    let cancelled = false;

    async function loadStages() {
      setLoadingStages(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/bonzo/pipelines/${encodeURIComponent(pipelineId)}/stages`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          pipeline?: BonzoPipelineOption | null;
          stages?: BonzoStageOption[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load Bonzo stages.");
        }

        if (!cancelled) {
          setStages(payload.stages ?? []);
          setPipelineName((current) => payload.pipeline?.name ?? current);
        }
      } catch (err) {
        if (!cancelled) {
          setStages([]);
          setError(err instanceof Error ? err.message : "Could not load Bonzo stages.");
        }
      } finally {
        if (!cancelled) {
          setLoadingStages(false);
        }
      }
    }

    loadStages();

    return () => {
      cancelled = true;
    };
  }, [pipelineId]);

  useEffect(() => {
    const selectedStage = stages.find((stage) => stage.id === stageId);
    if (selectedStage) {
      setStageName(selectedStage.name);
    } else if (!stageId) {
      setStageName("");
    }
  }, [stageId, stages]);

  const effectivePipelineName = useMemo(() => {
    return pipelineName || pipelines.find((pipeline) => pipeline.id === pipelineId)?.name || "";
  }, [pipelineId, pipelineName, pipelines]);

  const effectiveStageName = useMemo(() => {
    return stageName || stages.find((stage) => stage.id === stageId)?.name || "";
  }, [stageId, stageName, stages]);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="bonzo_pipeline_id" value={pipelineId} />
      <input type="hidden" name="bonzo_pipeline_name" value={effectivePipelineName} />
      <input type="hidden" name="bonzo_stage_id" value={stageId} />
      <input type="hidden" name="bonzo_stage_name" value={effectiveStageName} />

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Bonzo CRM</h2>
        <p className="mt-1 text-sm text-slate-600">
          Registrants will automatically be added to the selected Bonzo stage.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Pipeline</span>
          <select
            value={pipelineId}
            onChange={(event) => {
              setPipelineId(event.target.value);
              setStageId("");
              setStageName("");
            }}
            disabled={loadingPipelines}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">
              {loadingPipelines ? "Loading Bonzo pipelines..." : "No Bonzo integration"}
            </option>
            {pipelines.map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Stage</span>
          <select
            value={stageId}
            onChange={(event) => {
              const nextStageId = event.target.value;
              setStageId(nextStageId);
              setStageName(stages.find((stage) => stage.id === nextStageId)?.name ?? "");
            }}
            disabled={!pipelineId || loadingStages}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">
              {!pipelineId
                ? "Select a pipeline first"
                : loadingStages
                  ? "Loading Bonzo stages..."
                  : "No Bonzo integration"}
            </option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </div>
      ) : null}
    </section>
  );
}
