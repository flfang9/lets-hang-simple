"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Clock, MapPin, MessageSquare, Send, CheckCircle, XCircle, Copy, Sun, Moon, Plus, Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { useLocalStorage } from "@uidotdev/usehooks"

// Types
type SuggestionType = "time" | "location" | "general"

type Suggestion = {
  id: string
  content: string
  type: SuggestionType
  votes: number
}

type Hang = {
  id: string
  name: string
  suggestions: Suggestion[]
  isDarkMode: boolean
}

// Utility functions
const generateHangId = (): string => uuidv4().slice(0, 6).toUpperCase()

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

// Suggestion Item Component
const SuggestionItem = ({
  suggestion,
  isDarkMode,
  onVote,
  onRemoveSuggestion,
}: {
  suggestion: Suggestion
  isDarkMode: boolean
  onVote: (suggestionId: string, voteChange: number) => void
  onRemoveSuggestion: (suggestionId: string) => void
}) => {
  const [voted, setVoted] = useState(0) // -1, 0, 1

  return (
    <div className={`flex items-center justify-between p-3 rounded-md ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
      <div className="flex-1 min-w-0 mr-4">
        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{suggestion.content}</p>
        <div className="flex items-center text-xs text-gray-500 mt-1">
          <span className="mr-2">Type: {suggestion.type}</span>
          <span>Votes: {suggestion.votes}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            onVote(suggestion.id, 1)
            setVoted(1)
          }}
          disabled={voted !== 0}
          className={`p-1 rounded-full hover:bg-green-200 ${voted === 1 ? "bg-green-500" : ""}`}
        >
          <CheckCircle className={`w-5 h-5 ${voted === 1 ? "text-white" : "text-green-500"}`} />
        </button>
        <button
          onClick={() => {
            onVote(suggestion.id, -1)
            setVoted(-1)
          }}
          disabled={voted !== 0}
          className={`p-1 rounded-full hover:bg-red-200 ${voted === -1 ? "bg-red-500" : ""}`}
        >
          <XCircle className={`w-5 h-5 ${voted === -1 ? "text-white" : "text-red-500"}`} />
        </button>
        <button onClick={() => onRemoveSuggestion(suggestion.id)} className="p-1 rounded-full hover:bg-red-200">
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  )
}

// Main App Component
const LetsHangApp = () => {
  const [hangId, setHangId] = useState<string | null>(null)
  const [hangName, setHangName] = useState<string>("")
  const [newHangName, setNewHangName] = useState<string>("")
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [localHangs, setLocalHangs] = useLocalStorage<Hang[]>("hangs", [])
  const [currentHang, setCurrentHang] = useState<Hang | null>(null)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  // Load hang if hangId exists in URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlHangId = params.get("hangId")
    if (urlHangId) {
      setHangId(urlHangId)
    }
  }, [])

  // Load hang data when hangId changes
  useEffect(() => {
    if (hangId) {
      const hang = localHangs?.find((h) => h.id === hangId)
      setCurrentHang(hang || null)
    } else {
      setCurrentHang(null)
    }
  }, [hangId, localHangs])

  // Update hang name in local storage
  useEffect(() => {
    if (currentHang) {
      setHangName(currentHang.name)
      setIsDarkMode(currentHang.isDarkMode)
    }
  }, [currentHang])

  // Handlers
  const handleCreateHang = () => {
    setIsCreatingNew(true)
  }

  const handleStartHang = () => {
    if (!newHangName.trim()) {
      setError("Hang name is required.")
      return
    }

    const newId = generateHangId()
    const newHang: Hang = {
      id: newId,
      name: newHangName.trim(),
      suggestions: [],
      isDarkMode: isDarkMode,
    }

    setLocalHangs([...(localHangs || []), newHang])
    setHangId(newId)
    setIsCreatingNew(false)
    setSuccessMessage("New hang created! Share the link to invite others.")
    setError(null)
  }

  const handleJoinHang = () => {
    if (!hangId?.trim()) {
      setError("Hang ID is required.")
      return
    }

    if (localHangs?.find((h) => h.id === hangId)) {
      setSuccessMessage("Joined existing hang!")
      setError(null)
    } else {
      setError("Hang not found. Please check the ID.")
    }
  }

  const handleAddSuggestion = async (hangId: string, content: string, type: SuggestionType) => {
    const newSuggestion: Suggestion = {
      id: uuidv4(),
      content,
      type,
      votes: 0,
    }

    const updatedHangs = localHangs?.map((hang) =>
      hang.id === hangId ? { ...hang, suggestions: [...hang.suggestions, newSuggestion] } : hang,
    )
    setLocalHangs(updatedHangs)
    setSuccessMessage("Suggestion added!")
  }

  const handleVote = (suggestionId: string, voteChange: number) => {
    const updatedHangs = localHangs?.map((hang) => {
      if (hang.id === hangId) {
        const updatedSuggestions = hang.suggestions.map((suggestion) => {
          if (suggestion.id === suggestionId) {
            return { ...suggestion, votes: suggestion.votes + voteChange }
          }
          return suggestion
        })
        return { ...hang, suggestions: updatedSuggestions }
      }
      return hang
    })
    setLocalHangs(updatedHangs)
  }

  const handleRemoveSuggestion = (suggestionId: string) => {
    const updatedHangs = localHangs?.map((hang) => {
      if (hang.id === hangId) {
        const updatedSuggestions = hang.suggestions.filter((suggestion) => suggestion.id !== suggestionId)
        return { ...hang, suggestions: updatedSuggestions }
      }
      return hang
    })
    setLocalHangs(updatedHangs)
  }

  const handleCopyLink = () => {
    if (hangId) {
      navigator.clipboard.writeText(`${window.location.origin}?hangId=${hangId}`)
      setSuccessMessage("Link copied to clipboard!")
    }
  }

  const handleToggleDarkMode = () => {
    const updatedHangs = localHangs?.map((hang) => {
      if (hang.id === hangId) {
        return { ...hang, isDarkMode: !hang.isDarkMode }
      }
      return hang
    })
    setLocalHangs(updatedHangs)
    setIsDarkMode(!isDarkMode)
  }

  const handleLeaveHang = () => {
    setHangId(null)
    setSuccessMessage("Left the hang.")
  }

  return (
    <div
      className={`min-h-screen py-10 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      } transition-colors duration-300`}
    >
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🎉 Let's Hang</h1>
          <button onClick={handleToggleDarkMode} className="p-2 rounded-full hover:bg-gray-200">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {successMessage && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{successMessage}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg
                className="fill-current h-6 w-6 text-green-500"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                onClick={() => setSuccessMessage(null)}
              >
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg
                className="fill-current h-6 w-6 text-red-500"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                onClick={() => setError(null)}
              >
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}

        {/* Join/Create Hang Section */}
        {!hangId ? (
          <div className="space-y-4">
            {/* Create New Hang */}
            {isCreatingNew ? (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                <h2 className="text-lg font-medium mb-3">Start a New Hang</h2>
                <input
                  type="text"
                  placeholder="Hang Name"
                  className={`w-full px-3 py-2 border rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-black placeholder-gray-500"
                  }`}
                  value={newHangName}
                  onChange={(e) => setNewHangName(e.target.value)}
                />
                <button
                  onClick={handleStartHang}
                  className="mt-3 px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  Start Hang
                </button>
              </div>
            ) : (
              <button
                onClick={handleCreateHang}
                className="block w-full px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Create a New Hang
              </button>
            )}

            {/* Join Existing Hang */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <h2 className="text-lg font-medium mb-3">Join an Existing Hang</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Hang ID"
                  className={`flex-1 px-3 py-2 border rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-black placeholder-gray-500"
                  }`}
                  value={hangId || ""}
                  onChange={(e) => setHangId(e.target.value.toUpperCase())}
                />
                <button
                  onClick={handleJoinHang}
                  className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Current Hang View */
          currentHang && (
            <div className="space-y-4">
              {/* Hang Name and Options */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-medium">{hangName}</h2>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center text-xs text-gray-500 hover:text-gray-400"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Invite Link
                  </button>
                </div>
                <button
                  onClick={handleLeaveHang}
                  className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-800"
                >
                  Leave Hang
                </button>
              </div>

              {/* Suggestion Input */}
              <SuggestionInput hangId={hangId} isDarkMode={isDarkMode} onAddSuggestion={handleAddSuggestion} />

              {/* Suggestion List */}
              <div>
                <h3 className="text-sm font-medium mb-3">Suggestions</h3>
                <div className="space-y-2">
                  {currentHang.suggestions
                    .sort((a, b) => b.votes - a.votes)
                    .map((suggestion) => (
                      <SuggestionItem
                        key={suggestion.id}
                        suggestion={suggestion}
                        isDarkMode={isDarkMode}
                        onVote={handleVote}
                        onRemoveSuggestion={handleRemoveSuggestion}
                      />
                    ))}
                </div>
                {currentHang.suggestions.length === 0 && (
                  <p className="text-gray-500">No suggestions yet. Add one above!</p>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  return <LetsHangApp />
}
