"use client";

import { useEffect } from "react";
import { getToken } from "@/lib/auth";
import { getAllOutboxMessages, removeOutboxMessage } from "@/lib/db";
import { postMessage } from "@/lib/api";

export default function OfflineSync() {
  useEffect(() => {
    const handleOnline = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const outbox = await getAllOutboxMessages();
        for (const msg of outbox) {
          try {
            await postMessage(token, {
              text: msg.text,
              photo: msg.photo,
              position: msg.position,
              chatid: msg.chatid,
              important: msg.important
            });
            // If success, remove from outbox
            await removeOutboxMessage(msg.id);
          } catch (e: any) {
            // If it failed because we went offline again, stop trying.
            if (!navigator.onLine || e.message === "Failed to fetch") {
                break;
            }
            console.error("Failed to sync message", msg.id, e);
          }
        }
      } catch (e) {
        console.error("Failed to read outbox", e);
      }
    };

    window.addEventListener("online", handleOnline);
    
    if (navigator.onLine) {
       handleOnline();
    }

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
