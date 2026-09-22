"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toPng } from "html-to-image";
import { Download, Share } from "lucide-react";
import { MissingResult } from "@/components/missing-result";
import { ShareCard } from "@/components/share-card";
import { getServerSessionSnapshot, getSessionSnapshot, subscribeSession } from "@/lib/storage";
import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/types";

const SHARE_FILENAME = "my-ikigai-career-card.png";
const DOWNLOAD_FILENAME = "ikigai-career-alignment.png";
const SHARE_TEXT = "My Ikigai career card.";

async function renderCard(node: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  const options = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: 1,
    backgroundColor: "#F3EEE4",
    cacheBust: true,
  };
  let dataUrl: string;
  try {
    dataUrl = await toPng(node, options);
  } catch {
    dataUrl = await toPng(node, { ...options, skipFonts: true });
  }
  const response = await fetch(dataUrl);
  return response.blob();
}

function canShare(data: ShareData) {
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare(data);
  } catch {
    return false;
  }
}

async function shareFile(blob: Blob): Promise<"shared" | "cancelled" | "unsupported"> {
  const file = new File([blob], SHARE_FILENAME, { type: "image/png" });
  const withCaption = { files: [file], title: "My Ikigai career card", text: SHARE_TEXT };
  const payload = canShare(withCaption) ? withCaption : { files: [file] };
  if (!canShare(payload)) return "unsupported";
  try {
    await navigator.share(payload);
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ShareStudio() {
  const cardRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const snapshot = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);
  const [scale, setScale] = useState(0.34);
  const [downloadError, setDownloadError] = useState("");
  const [shareNote, setShareNote] = useState("");
  const [busy, setBusy] = useState<"share" | "download" | null>(null);
  const hasCard = snapshot.status === "ready";

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setScale(frame.clientWidth / CARD_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [hasCard]);

  async function download() {
    const node = cardRef.current;
    if (!node || busy) return;
    setBusy("download");
    setDownloadError("");
    setShareNote("");
    try {
      saveBlob(await renderCard(node), DOWNLOAD_FILENAME);
    } catch {
      setDownloadError("The image could not be created in this browser. Try again in Chrome or Safari.");
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    const node = cardRef.current;
    if (!node || busy) return;
    setBusy("share");
    setDownloadError("");
    setShareNote("");
    try {
      const blob = await renderCard(node);
      const outcome = await shareFile(blob);
      if (outcome === "shared" || outcome === "cancelled") return;
      saveBlob(blob, SHARE_FILENAME);
      setShareNote("Your card is ready to post.");
    } catch {
      setDownloadError("The image could not be created in this browser. Try again in Chrome or Safari.");
    } finally {
      setBusy(null);
    }
  }

  if (snapshot.status === "pending") {
    return <div className="px-5 py-24 text-sm text-ink/60">Loading your card…</div>;
  }

  if (snapshot.status === "empty") {
    return (
      <MissingResult
        title="No card yet"
        body="Finish a comparison first. The card is built from that result."
      />
    );
  }

  const session = snapshot.session;

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 md:grid-cols-[minmax(0,0.7fr)_minmax(280px,1fr)] md:py-16">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] text-forest uppercase">Ikigai Career Card</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">
          Your Ikigai card is ready to share.
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-ink/75">
          Share your card and start a conversation.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              void share();
            }}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-forest px-4 py-3 text-sm font-medium text-paper hover:bg-[#1d3e33] disabled:opacity-60"
          >
            <Share className="size-4" aria-hidden="true" />
            {busy === "share" ? "Preparing image…" : "Share my card"}
          </button>
          <button
            type="button"
            onClick={() => {
              void download();
            }}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-forest bg-transparent px-4 py-3 text-sm font-medium text-forest hover:bg-forest/5 disabled:opacity-60"
          >
            <Download className="size-4" aria-hidden="true" />
            Download image
          </button>
        </div>
        {shareNote ? <p className="mt-3 text-sm text-ink/70">{shareNote}</p> : null}
        {downloadError ? (
          <p className="mt-4 text-sm text-error" role="alert">
            {downloadError}
          </p>
        ) : null}
        <Link href="/result" className="mt-8 block text-sm text-ink/75 underline-offset-4 hover:underline">
          Back to results
        </Link>
      </div>

      <div ref={frameRef} className="w-full">
        <div className="relative w-full overflow-hidden" style={{ height: CARD_HEIGHT * scale }}>
          <div
            className="absolute top-0 left-0"
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <ShareCard
              cardRef={cardRef}
              name={session.input.name}
              currentTitle={session.input.currentRole.title}
              idealTitle={session.input.idealRole.title}
              currentScore={session.result.current.ikigaiFit}
              idealScore={session.result.ideal.ikigaiFit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
