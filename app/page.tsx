"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Plus, Clock, MapPin, Users, Sun, Moon, Share, Home, ChevronDown, ChevronUp, Send } from "lucide-react"

// Types
type Suggestion = {
  id: string
  content: string
  type: "time" | "location" | "general"
  author: string
}

type Attendee = {
  id: string
  name: string
  status: "going" | "maybe" | "not-going"
}

type Hang = {
  id: string
  title: string
  date: string
  time: string
  location: string
  description?: string
  attendees: Attendee[]
  maxAttendees: number
  userRSVP?: "going" | "maybe" | "not-going" | null
  host: string
  suggestions: Suggestion[]
}

export default function LetsHangApp() {
  const [currentView, setCurrentView] = useState<"home" | "create" | "past">("home")
  const [hangs, setHangs] = useState<Hang[]>([
    {
      id: "ABC123",
      title: "Shared Hang",
      date: "2024-01-15",
      time: "19:00",
      location: "TBD",
      description: "This is a shared hang! The host will update details soon.",
      attendees: [
        { id: "1", name: "Friend", status: "going" },
        { id: "2", name: "Freddy", status: "going" },
      ],
      maxAttendees: 10,
      userRSVP: "going",
      host: "Friend",
      suggestions: [],
    },
  ])
  const [expandedHangId, setExpandedHangId] = useState<string | null>("ABC123")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedSuggestionType, setSelectedSuggestionType] = useState<"time" | "location" | "general">("general")
  const formRef = useRef<HTMLFormElement>(null)
  const suggestionRef = useRef<HTMLFormElement>(null)

  const handleCreateHang = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    const newHang: Hang = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      title: formData.get("title") as string,
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      location: formData.get("location") as string,
      description: (formData.get("description") as string) || "",
      attendees: [{ id: "user", name: "Freddy", status: "going" }],
      maxAttendees: Number.parseInt(formData.get("maxAttendees") as string) || 10,
      userRSVP: "going",
      host: "Freddy",
      suggestions: [],
    }

    setHangs([...hangs, newHang])
    setCurrentView("home")
    if (formRef.current) {
      formRef.current.reset()
    }
  }

  const handleRSVP = (hangId: string, rsvp: "going" | "maybe" | "not-going") => {
    setHangs(
      hangs.map((hang) => {
        if (hang.id === hangId) {
          const updatedAttendees = hang.attendees.map((attendee) =>
            attendee.name === "Freddy" ? { ...attendee, status: rsvp } : attendee,
          )
          return { ...hang, userRSVP: rsvp, attendees: updatedAttendees }
        }
        return hang
      }),
    )
  }

  const handleAddSuggestion = (e: React.FormEvent, hangId: string) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const content = formData.get("suggestion") as string

    if (content?.trim()) {
      const newSuggestion: Suggestion = {
        id: Math.random().toString(36).substr(2, 9),
        content: content.trim(),
        type: selectedSuggestionType,
        author: "Freddy",
      }

      setHangs(
        hangs.map((hang) =>
          hang.id === hangId ? { ...hang, suggestions: [...hang.suggestions, newSuggestion] } : hang,
        ),
      )

      if (suggestionRef.current) {
        suggestionRef.current.reset()
      }
    }
  }

  const shareHang = (hang: Hang) => {
    const shareText = `🎉 Join me for ${hang.title}!\n📅 ${hang.date} at ${hang.time}\n📍 ${hang.location}`
    if (navigator.share) {
      navigator.share({ title: hang.title, text: shareText })
    } else {
      navigator.clipboard.writeText(shareText)
      alert("Hang details copied to clipboard!")
    }
  }

  const getRSVPColor = (rsvp: string | null, currentRSVP: string) => {
    if (rsvp === currentRSVP) {
      return currentRSVP === "going" ? "bg-black text-white" : "bg-gray-200 text-black border border-gray-300"
    }
    return "bg-white border border-gray-300 text-black hover:bg-gray-50"
  }

  const getSuggestionTypeColor = (type: string) => {
    if (selectedSuggestionType === type) {
      return type === "general" ? "bg-black text-white" : "bg-gray-200 text-black"
    }
    return "bg-gray-100 text-gray-600 hover:bg-gray-200"
  }

  const themeClasses = isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"

  return (
    <div className={`max-w-sm mx-auto min-h-screen transition-all duration-300 ${themeClasses}`}>
      {/* Header */}
      <div className={`flex justify-between items-center p-4 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <div>
          <h1 className="text-xl font-bold">Let's Hang</h1>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Hey Freddy! 👋</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-500" />
            <div
              className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${
                isDarkMode ? "bg-gray-600" : "bg-gray-300"
              }`}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  isDarkMode ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </div>
            <Moon className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20 px-4">
        {/* Home View */}
        {currentView === "home" && (
          <div>
            {hangs.length > 0 ? (
              <div className="space-y-4">
                {hangs.map((hang) => {
                  const isExpanded = expandedHangId === hang.id
                  const goingCount = hang.attendees.filter((a) => a.status === "going").length

                  return (
                    <div
                      key={hang.id}
                      className={`rounded-lg border p-4 shadow-sm ${
                        isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-black"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-gray-400" />
                          <h3 className="font-semibold text-lg">{hang.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-2xl font-bold">{goingCount}</div>
                            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              of {hang.maxAttendees}
                            </div>
                          </div>
                          <button onClick={() => shareHang(hang)} className="p-1">
                            <Share className="w-5 h-5 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className={`flex items-center text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          <Clock className="w-4 h-4 mr-2" />
                          {hang.date} at {hang.time}
                        </div>
                        <div className={`flex items-center text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          <MapPin className="w-4 h-4 mr-2" />
                          {hang.location}
                        </div>
                        <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Hosted by {hang.host}
                        </div>
                      </div>

                      {/* RSVP Buttons */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => handleRSVP(hang.id, "going")}
                          className={`flex-1 text-sm py-2 px-3 rounded-md transition-all duration-200 ${
                            hang.userRSVP === "going"
                              ? "bg-black text-white"
                              : isDarkMode
                                ? "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                                : "bg-white border border-gray-300 text-black hover:bg-gray-50"
                          }`}
                        >
                          Going
                        </button>
                        <button
                          onClick={() => handleRSVP(hang.id, "maybe")}
                          className={`flex-1 text-sm py-2 px-3 rounded-md transition-all duration-200 ${
                            hang.userRSVP === "maybe"
                              ? isDarkMode
                                ? "bg-gray-600 text-white"
                                : "bg-gray-200 text-black border border-gray-300"
                              : isDarkMode
                                ? "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                                : "bg-white border border-gray-300 text-black hover:bg-gray-50"
                          }`}
                        >
                          Maybe
                        </button>
                        <button
                          onClick={() => handleRSVP(hang.id, "not-going")}
                          className={`flex-1 text-sm py-2 px-3 rounded-md transition-all duration-200 ${
                            hang.userRSVP === "not-going"
                              ? isDarkMode
                                ? "bg-gray-600 text-white"
                                : "bg-gray-200 text-black border border-gray-300"
                              : isDarkMode
                                ? "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                                : "bg-white border border-gray-300 text-black hover:bg-gray-50"
                          }`}
                        >
                          Not Going
                        </button>
                      </div>

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => setExpandedHangId(isExpanded ? null : hang.id)}
                        className={`w-full text-sm flex items-center justify-center py-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        {isExpanded ? "Show Less" : "Show More"}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div
                          className={`mt-4 pt-4 border-t space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
                        >
                          {/* About */}
                          <div>
                            <h4 className="font-medium mb-2">About this hang</h4>
                            <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {hang.description}
                            </p>
                          </div>

                          {/* Who's going */}
                          <div>
                            <h4 className="font-medium mb-2">Who's going ({goingCount})</h4>
                            <div className="space-y-2">
                              {hang.attendees
                                .filter((attendee) => attendee.status === "going")
                                .map((attendee) => (
                                  <div key={attendee.id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-medium">
                                        {attendee.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <span className="text-sm">{attendee.name}</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      {attendee.status}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Suggest a change */}
                          <div>
                            <h4 className="font-medium mb-3">Suggest a change</h4>

                            {/* Type selector */}
                            <div className="flex gap-1 mb-3">
                              <button
                                onClick={() => setSelectedSuggestionType("time")}
                                className={`px-3 py-1 text-xs rounded transition-colors ${getSuggestionTypeColor("time")}`}
                              >
                                <Clock className="w-3 h-3 inline mr-1" />
                                Time
                              </button>
                              <button
                                onClick={() => setSelectedSuggestionType("location")}
                                className={`px-3 py-1 text-xs rounded transition-colors ${getSuggestionTypeColor("location")}`}
                              >
                                <MapPin className="w-3 h-3 inline mr-1" />
                                Location
                              </button>
                              <button
                                onClick={() => setSelectedSuggestionType("general")}
                                className={`px-3 py-1 text-xs rounded transition-colors ${getSuggestionTypeColor("general")}`}
                              >
                                General
                              </button>
                            </div>

                            {/* Suggestion input */}
                            <form
                              ref={suggestionRef}
                              onSubmit={(e) => handleAddSuggestion(e, hang.id)}
                              className="flex gap-2"
                            >
                              <textarea
                                name="suggestion"
                                placeholder={`Type your ${selectedSuggestionType} suggestion here...`}
                                className={`flex-1 px-3 py-2 border rounded-md text-sm resize-none ${
                                  isDarkMode
                                    ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                                    : "border-gray-300 bg-white text-black"
                                }`}
                                rows={2}
                              />
                              <button
                                type="submit"
                                className={`px-3 py-2 rounded-md transition-colors ${
                                  isDarkMode
                                    ? "bg-white text-black hover:bg-gray-200"
                                    : "bg-black text-white hover:bg-gray-800"
                                }`}
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </form>

                            {/* Suggestions list */}
                            {hang.suggestions.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {hang.suggestions.map((suggestion) => (
                                  <div key={suggestion.id} className="p-2 bg-gray-50 rounded text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{suggestion.author}</span>
                                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">{suggestion.type}</span>
                                    </div>
                                    <p>{suggestion.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hangs yet</h3>
                <p className="text-sm mb-4 text-gray-600">Create your first hang and invite friends!</p>
                <button
                  onClick={() => setCurrentView("create")}
                  className="px-6 py-3 bg-black text-white rounded-md font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Hang
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create View */}
        {currentView === "create" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Create Hangout</h2>
            </div>

            <form ref={formRef} onSubmit={handleCreateHang} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hang Title *</label>
                <input
                  name="title"
                  placeholder="What are you planning?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    name="date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time *</label>
                  <input
                    name="time"
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <input
                  name="location"
                  placeholder="Where should everyone meet?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  placeholder="Tell everyone what to expect..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Attendees</label>
                <input
                  name="maxAttendees"
                  type="number"
                  placeholder="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button type="submit" className="w-full px-4 py-3 bg-black text-white rounded-md font-medium">
                Create Hangout
              </button>
            </form>
          </div>
        )}

        {/* Past View */}
        {currentView === "past" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Past Hangs</h2>
            </div>
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">No past hangs yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 px-4 py-2 border-t transition-all duration-200 ${
          isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex justify-around max-w-sm mx-auto">
          <button
            onClick={() => setCurrentView("home")}
            className={`flex flex-col items-center p-2 transition-all duration-200 ${
              currentView === "home"
                ? isDarkMode
                  ? "text-white"
                  : "text-black"
                : isDarkMode
                  ? "text-gray-500"
                  : "text-gray-400"
            }`}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => setCurrentView("create")}
            className={`flex flex-col items-center p-2 transition-all duration-200 ${
              currentView === "create"
                ? isDarkMode
                  ? "text-white"
                  : "text-black"
                : isDarkMode
                  ? "text-gray-500"
                  : "text-gray-400"
            }`}
          >
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-xs">Create</span>
          </button>
          <button
            onClick={() => setCurrentView("past")}
            className={`flex flex-col items-center p-2 transition-all duration-200 ${
              currentView === "past"
                ? isDarkMode
                  ? "text-white"
                  : "text-black"
                : isDarkMode
                  ? "text-gray-500"
                  : "text-gray-400"
            }`}
          >
            <Clock className="w-5 h-5 mb-1" />
            <span className="text-xs">Past</span>
          </button>
        </div>
      </div>
    </div>
  )
}
