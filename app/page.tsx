"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Clock, MapPin, MessageSquare, Send } from "lucide-react"

// Native HTML suggestion input component
const SuggestionInput = ({
  hangId,
  isDarkMode,
  onAddSuggestion,
}: {
  hangId: string
  isDarkMode: boolean
  onAddSuggestion: (hangId: string, content: string, type: "time" | "location" | "general") => void
}) => {
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedType, setSelectedType] = useState<"time" | "location" | "general">("general")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const content = formData.get("suggestion") as string

    if (content?.trim() && !loading) {
      setLoading(true)
      await onAddSuggestion(hangId, content.trim(), selectedType)
      if (formRef.current) {
        formRef.current.reset()
      }
      setLoading(false)
    }
  }

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Suggest a change</h4>
      <div className="space-y-3">
        {/* Type selector */}
        <div className="flex gap-1 mb-3">
          {[
            { type: "time", icon: Clock, label: "Time" },
            { type: "location", icon: MapPin, label: "Location" },
            { type: "general", icon: MessageSquare, label: "General" },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              type="button"
              className={`px-2 py-1 text-xs rounded cursor-pointer select-none transition-colors border-0 outline-none ${
                selectedType === type
                  ? isDarkMode
                    ? "bg-white text-black"
                    : "bg-black text-white"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedType(type as "time" | "location" | "general")}
            >
              <Icon className="w-3 h-3 inline mr-1" />
              {label}
            </button>
          ))}
        </div>

        {/* Native HTML form */}
        <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <textarea
              name="suggestion"
              placeholder={`Type your ${selectedType} suggestion here...`}
              className={`w-full text-sm resize-none min-h-[60px] px-3 py-2 border rounded-md ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black placeholder-gray-500"
              }`}
              rows={2}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (formRef.current) {
                    formRef.current.requestSubmit()
                  }
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`shrink-0 self-start mt-1 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
              isDarkMode ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>🎉 Let's Hang - It Works!</h1>
      <p>Your app is successfully deployed!</p>
    </div>
  )
}
