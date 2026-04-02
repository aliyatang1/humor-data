"use client";

import { useState } from "react";
import {
  createHumorFlavor,
  createHumorFlavorStep,
  getHumorFlavors,
  getHumorFlavorSteps,
} from "@/app/actions/admin";

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "error" | "warn";
  message: string;
}

export default function CreateTestFlavorPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [createdFlavorId, setCreatedFlavorId] = useState<number | null>(null);

  function log(level: LogEntry["level"], message: string) {
    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toISOString(), level, message },
    ]);
  }

  async function runCreateAndTest() {
    setRunning(true);
    setLogs([]);
    setTestResult(null);
    setCreatedFlavorId(null);

    try {
      // Step 1: Check if flavor already exists
      log("info", "Checking for existing 'wildlife-documentary' flavor...");
      const existingFlavors = await getHumorFlavors();
      const existing = existingFlavors.find(
        (f: { slug: string }) => f.slug === "wildlife-documentary"
      );

      let flavorId: number;

      if (existing) {
        log("warn", `Flavor already exists with id=${existing.id}. Reusing it.`);
        flavorId = existing.id;
      } else {
        // Step 2: Create the humor flavor
        log("info", "Creating 'wildlife-documentary' humor flavor...");
        const flavor = await createHumorFlavor(
          "Narrates any image as if it's a scene from a BBC nature documentary, with dramatic, over-the-top David Attenborough-style commentary. Treats mundane subjects as rare wildlife specimens and produces punchy viral captions.",
          "wildlife-documentary"
        );
        flavorId = flavor.id;
        log("success", `Flavor created with id=${flavorId}`);
      }

      setCreatedFlavorId(flavorId);

      // Step 3: Check existing steps
      const existingSteps = await getHumorFlavorSteps(flavorId);
      if (existingSteps.length > 0) {
        log("warn", `Flavor already has ${existingSteps.length} step(s). Skipping step creation.`);
      } else {
        // Step 4: Create Step 1 — Nature Documentary Narration
        log("info", "Creating Step 1: Nature Documentary Narration...");
        const step1 = await createHumorFlavorStep(
          flavorId,
          1, // order_by
          1.0, // temperature
          1, // llm_input_type_id
          1, // llm_output_type_id
          1, // llm_model_id
          1, // humor_flavor_step_type_id
          "You are Sir David Attenborough narrating a nature documentary. Treat everything in the image as if it is a rare and fascinating specimen in its natural habitat. Use dramatic pauses (indicated by '...'), hushed reverence, and over-the-top scientific-sounding observations. Be detailed and vivid.",
          "Narrate what you see in this image as if it's a scene from Planet Earth. Describe the subjects as wildlife specimens, their behavior, habitat, and survival strategies. Keep it under 150 words.",
          "Generates dramatic nature documentary narration of the image"
        );
        log("success", `Step 1 created with id=${step1.id}`);

        // Step 5: Create Step 2 — Caption Distillation
        log("info", "Creating Step 2: Caption Distillation...");
        const step2 = await createHumorFlavorStep(
          flavorId,
          2, // order_by
          1.2, // temperature (more creative for punchiness)
          1, // llm_input_type_id
          1, // llm_output_type_id
          1, // llm_model_id
          1, // humor_flavor_step_type_id
          "You are a comedy writer specializing in nature documentary parody. Take the narration provided and distill it into a single punchy, funny caption (1-2 sentences max). The caption should work as a standalone joke without needing the full narration. Keep the Attenborough documentary tone.",
          "Distill the following nature documentary narration into a single hilarious caption that could go viral on social media. The caption should be self-contained and immediately funny:\n\n{previous_step_output}",
          "Distills narration into a punchy viral caption"
        );
        log("success", `Step 2 created with id=${step2.id}`);
      }

      // Step 6: Verify by reading back from database
      log("info", "Verifying flavor and steps in database...");
      const verifySteps = await getHumorFlavorSteps(flavorId);
      const verifyFlavors = await getHumorFlavors();
      const verifyFlavor = verifyFlavors.find((f: { id: number }) => f.id === flavorId);

      if (verifyFlavor && verifySteps.length >= 2) {
        log("success", `Verified: flavor '${verifyFlavor.slug}' exists with ${verifySteps.length} step(s).`);
        log("success", `Step 1: order=${verifySteps[0].order_by}, temp=${verifySteps[0].llm_temperature} — ${verifySteps[0].description}`);
        log("success", `Step 2: order=${verifySteps[1].order_by}, temp=${verifySteps[1].llm_temperature} — ${verifySteps[1].description}`);
        log("success", "Humor flavor created and verified successfully!");
        setTestResult({
          flavor: verifyFlavor as unknown as Record<string, unknown>,
          steps: verifySteps as unknown as Record<string, unknown>,
        });
      } else {
        log("error", "Verification failed: flavor or steps not found in database.");
      }
    } catch (err) {
      log("error", `Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  }

  const levelStyles = {
    info: "text-blue-400",
    success: "text-green-400",
    error: "text-red-400",
    warn: "text-yellow-400",
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Create & Test: Wildlife Documentary Flavor</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This page creates a &quot;wildlife-documentary&quot; humor flavor with 2 processing steps,
        then verifies everything was saved correctly in the database.
      </p>

      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
        <h2 className="font-semibold mb-2">Flavor: wildlife-documentary</h2>
        <p className="mb-2">
          Narrates images as BBC nature documentary scenes with David Attenborough-style commentary.
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
          <li>
            <strong>Step 1</strong> (temp 1.0): Generate dramatic nature documentary narration
          </li>
          <li>
            <strong>Step 2</strong> (temp 1.2): Distill narration into a punchy viral caption
          </li>
        </ul>
      </div>

      <button
        onClick={runCreateAndTest}
        disabled={running}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {running ? "Running..." : "Create & Test Flavor"}
      </button>

      {createdFlavorId && (
        <p className="mt-3 text-sm text-gray-500">
          Flavor ID: <span className="font-mono">{createdFlavorId}</span> —{" "}
          <a
            href="/admin/humor-flavors"
            className="text-purple-500 underline hover:text-purple-400"
          >
            View in Admin
          </a>
        </p>
      )}

      {logs.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <h3 className="text-gray-400 mb-2 font-sans font-semibold">Log</h3>
          {logs.map((entry, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gray-600 shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className={`uppercase font-bold w-16 shrink-0 ${levelStyles[entry.level]}`}>
                {entry.level}
              </span>
              <span className="text-gray-200">{entry.message}</span>
            </div>
          ))}
        </div>
      )}

      {testResult && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Verification Result</h3>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
