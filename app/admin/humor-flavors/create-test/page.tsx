"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  createHumorFlavor,
  createHumorFlavorStep,
  getHumorFlavors,
  getHumorFlavorSteps,
  getImages,
} from "@/app/actions/admin";

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "error" | "warn";
  message: string;
}

export default function CreateIceCreamFlavorPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [createdFlavorId, setCreatedFlavorId] = useState<number | null>(null);

  const [batchRunning, setBatchRunning] = useState(false);
  const [batchLogs, setBatchLogs] = useState<LogEntry[]>([]);
  const [batchResults, setBatchResults] = useState<{ run: number; imageId: string; caption: string | null; error: string | null }[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  function blogBatch(level: LogEntry["level"], message: string) {
    setBatchLogs((prev) => [
      ...prev,
      { timestamp: new Date().toISOString(), level, message },
    ]);
  }

  async function runFiveTests() {
    setBatchRunning(true);
    setBatchLogs([]);
    setBatchResults([]);

    try {
      blogBatch("info", "Fetching images and flavors...");
      const [images, flavors] = await Promise.all([getImages(), getHumorFlavors()]);

      if (images.length === 0) {
        blogBatch("error", "No images found in database. Upload at least one image first.");
        return;
      }
      if (flavors.length === 0) {
        blogBatch("error", "No humor flavors found. Create a flavor first using the button above.");
        return;
      }

      const flavor = flavors[0];
      blogBatch("info", `Using flavor: '${flavor.slug}' (id=${flavor.id})`);
      blogBatch("info", `Found ${images.length} image(s). Running 5 tests...`);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        blogBatch("error", "No valid session. Please log in again.");
        return;
      }
      const token = session.access_token;

      const results: typeof batchResults = [];

      for (let i = 0; i < 5; i++) {
        const image = images[i % images.length];
        blogBatch("info", `Run ${i + 1}/5 — imageId=${image.id}`);

        try {
          const response = await fetch("https://api.almostcrackd.ai/pipeline/generate-captions", {
            method: "POST",
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageId: image.id, humorFlavorId: flavor.id }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            blogBatch("error", `Run ${i + 1} failed: ${response.status} — ${errorText}`);
            results.push({ run: i + 1, imageId: image.id, caption: null, error: `${response.status}: ${errorText}` });
          } else {
            const result = await response.json();
            const caption = typeof result === "string"
              ? result
              : Array.isArray(result)
                ? result[0]
                : result?.captions?.[0] ?? result?.caption ?? JSON.stringify(result);
            blogBatch("success", `Run ${i + 1} succeeded: ${caption}`);
            results.push({ run: i + 1, imageId: image.id, caption: String(caption), error: null });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          blogBatch("error", `Run ${i + 1} threw: ${msg}`);
          results.push({ run: i + 1, imageId: image.id, caption: null, error: msg });
        }
      }

      setBatchResults(results);
      const passed = results.filter((r) => r.caption !== null).length;
      blogBatch(passed === 5 ? "success" : "warn", `Completed: ${passed}/5 tests passed.`);
    } catch (err) {
      blogBatch("error", `Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBatchRunning(false);
    }
  }

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
      log("info", "Checking for existing 'ice-cream-flavor' flavor...");
      const existingFlavors = await getHumorFlavors();
      const existing = existingFlavors.find(
        (f: { slug: string }) => f.slug === "ice-cream-flavor"
      );

      let flavorId: number;

      if (existing) {
        log("warn", `Flavor already exists with id=${existing.id}. Reusing it.`);
        flavorId = existing.id;
      } else {
        log("info", "Creating 'ice-cream-flavor' humor flavor...");
        const flavor = await createHumorFlavor(
          "Reimagines any image as an ice cream flavor — inventing a creative flavor name, describing its taste profile, toppings, and vibes, then distilling it into a punchy caption.",
          "ice-cream-flavor"
        );
        flavorId = flavor.id;
        log("success", `Flavor created with id=${flavorId}`);
      }

      setCreatedFlavorId(flavorId);

      const existingSteps = await getHumorFlavorSteps(flavorId);
      if (existingSteps.length > 0) {
        log("warn", `Flavor already has ${existingSteps.length} step(s). Skipping step creation.`);
      } else {
        // Step 1 — Ice Cream Flavor Caption
        log("info", "Creating Step 1: Ice Cream Flavor Caption...");
        const step1 = await createHumorFlavorStep(
          flavorId,
          1,
          0.7,
          1, 1, 1, 1,
          "IMPORTANT: You MUST respond with ONLY a valid JSON array. No other text. Do not start with words like Introducing or Here. Start your response with [ and end with ]. You are a creative ice cream maker and witty copywriter. Given an image, invent a funny ice cream flavor name and write one punchy caption (1-2 sentences). Respond ONLY as: [\"Your caption here\"]",
          "Respond with ONLY a JSON array containing one funny ice cream caption. Start with [ and end with ]. Example: [\"Midnight Mango Meltdown — the only flavor that judges you for eating ice cream at 2am.\"]. Do NOT write any text outside the JSON array brackets.",
          "Invents a creative ice cream flavor and generates a viral caption"
        );
        log("success", `Step 1 created with id=${step1.id}`);
      }

      log("info", "Verifying flavor and steps in database...");
      const verifySteps = await getHumorFlavorSteps(flavorId);
      const verifyFlavors = await getHumorFlavors();
      const verifyFlavor = verifyFlavors.find((f: { id: number }) => f.id === flavorId);

      if (verifyFlavor && verifySteps.length >= 1) {
        log("success", `Verified: flavor '${verifyFlavor.slug}' exists with ${verifySteps.length} step(s).`);
        log("success", `Step 1: order=${verifySteps[0].order_by}, temp=${verifySteps[0].llm_temperature} — ${verifySteps[0].description}`);
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
      <h1 className="text-2xl font-bold mb-2">Create & Test: Ice Cream Flavor</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This page creates an &quot;ice-cream-flavor&quot; humor flavor with 1 processing step,
        then verifies everything was saved correctly in the database.
      </p>

      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
        <h2 className="font-semibold mb-2">Flavor: ice-cream-flavor</h2>
        <p className="mb-2">
          Reimagines any image as a creative ice cream flavor with a punchy viral caption.
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
          <li><strong>Step 1</strong> (temp 1.0): Invent a creative ice cream flavor and generate a viral caption</li>
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
          <a href="/admin/humor-flavors" className="text-purple-500 underline hover:text-purple-400">
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

      <hr className="my-10 border-gray-200 dark:border-gray-700" />

      <h2 className="text-xl font-bold mb-2">Run 5 API Tests</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Calls <code className="text-sm bg-gray-100 dark:bg-gray-800 px-1 rounded">/pipeline/generate-captions</code> 5 times using the first available flavor and cycling through images.
      </p>

      <button
        onClick={runFiveTests}
        disabled={batchRunning || running}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {batchRunning ? "Running tests..." : "Run 5 Tests"}
      </button>

      {batchLogs.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <h3 className="text-gray-400 mb-2 font-sans font-semibold">Test Log</h3>
          {batchLogs.map((entry, i) => (
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

      {batchResults.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Results</h3>
          <div className="space-y-3">
            {batchResults.map((r) => (
              <div
                key={r.run}
                className={`p-4 rounded-lg border ${
                  r.error
                    ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                    : "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">Run {r.run}</span>
                  <span className="text-xs text-gray-500 font-mono">{r.imageId}</span>
                  <span className={`text-xs font-bold ml-auto ${ r.error ? "text-red-500" : "text-green-600" }`}>
                    {r.error ? "FAILED" : "PASSED"}
                  </span>
                </div>
                {r.caption && <p className="text-gray-800 dark:text-gray-200">{r.caption}</p>}
                {r.error && <p className="text-red-600 dark:text-red-400 text-sm">{r.error}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
