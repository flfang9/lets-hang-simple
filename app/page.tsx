"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  supabase,
  getCurrentUser,
  getHangs,
  createHang,
  updateRSVP,
  addSuggestion,
  createOrUpdateUser,
} from "@/lib/flexible-supabase"
import AuthForm from "@/components/AuthForm"
import type { User, Hang } from "@/lib/supabase"
import { Plus, Clock, MapPin, Users, Sun, Moon, Share, Home, LogOut } from "lucide-react"

export default function LetsHangApp() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [currentView, setCurrentView] = useState<"home" | "create" | "past">("home")
  const [hangs, setHangs] = useState<Hang[]>([])
  const [expandedHangId, setExpandedHangId] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedSuggestionType, setSelectedSuggestionType] = useState<"time" | "location" | "general">("general")

  const addDebug = (message: string) => {
    console.log(message)
    setDebugInfo((prev) => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const checkUser = async () => {
      try {
        addDebug("🔍 Starting user check...")

        if (!supabase) {
          addDebug("❌ Supabase not initialized")
          setError("Supabase not configured")
          setLoading(false)
          return
        }

        addDebug("✅ Supabase initialized, checking auth...")

        // Simple auth check without listener
        const { data: authUser, error: authError } = await supabase.auth.getUser()
        addDebug(`🔍 Auth check complete. User: ${authUser.user ? "found" : "not found"}`)

        if (authError) {
          addDebug(`⚠️ Auth error: ${authError.message}`)
          setLoading(false)
          return
        }

        if (authUser.user) {
          addDebug(`✅ User authenticated: ${authUser.user.email}`)

          const { data: userData, error: userError } = await getCurrentUser()

          if (userError || !userData) {
            addDebug("🔄 Creating user record...")
            const { data: newUser, error: createError } = await createOrUpdateUser({
              name: authUser.user.email?.split("@")[0] || "User",
              email: authUser.user.email || "",
            })

            if (createError) {
              addDebug(`❌ Error creating user: ${createError.message}`)
              setError(`Error creating user: ${createError.message}`)
            } else if (newUser) {
              addDebug(`✅ User created: ${newUser.name}`)
              setUser(newUser)
            }
          } else {
            addDebug(`✅ User found: ${userData.name}`)
            setUser(userData)
          }
        } else {
          addDebug("ℹ️ No user - will show login form")
        }

        setLoading(false)
      } catch (err) {
        addDebug(`❌ Error: ${err}`)
        setError(`Error: ${err}`)
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  useEffect(() => {
    if (user && supabase) {
      addDebug(`🔄 Loading hangs for user: ${user.name}`)
      loadHangs()
    }
  }, [user])

  const loadHangs = async () => {
    if (!supabase) return

    try {
      addDebug("🔍 Fetching hangs from database...")
      const { data, error } = await getHangs()
      if (error) {
        addDebug(`❌ Error loading hangs: ${error.message}`)
        setError(`Error loading hangs: ${error.message}`)
      } else if (data) {
        addDebug(`✅ Hangs loaded: ${data.length} found`)
        setHangs(data)
      }
    } catch (err) {
      addDebug(`❌ Unexpected error loading hangs: ${err}`)
      setError(`Error loading hangs: ${err}`)
    }
  }

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setHangs([])
  }

  const handleCreateHang = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    const formData = new FormData(e.target as HTMLFormElement)

    const hangData = {
      title: formData.get("title") as string,
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      location: formData.get("location") as string,
      description: (formData.get("description") as string) || "",
      max_attendees: Number.parseInt(formData.get("maxAttendees") as string) || 10,
      status: "active" as const,
    }

    const { data, error } = await createHang(hangData)
    if (data && !error) {
      await loadHangs()
      setCurrentView("home")
      ;(e.target as HTMLFormElement).reset()
    }
  }

  const handleRSVP = async (hangId: string, status: "going" | "maybe" | "not-going") => {
    if (!supabase) return

    const { error } = await updateRSVP(hangId, status)
    if (!error) {
      await loadHangs()
    }
  }

  const handleAddSuggestion = async (e: React.FormEvent, hangId: string) => {
    e.preventDefault()
    if (!supabase) return

    const formData = new FormData(e.target as HTMLFormElement)
    const content = formData.get("suggestion") as string

    if (content?.trim()) {
      const { error } = await addSuggestion(hangId, selectedSuggestionType, content.trim())
      if (!error) {
        await loadHangs()
        ;(e.target as HTMLFormElement).reset()
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

  if (loading) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="mb-4">Loading...</p>

          {/* Debug info */}
          <div className="text-left bg-gray-100 p-3 rounded text-xs max-h-40 overflow-y-auto">
            <p className="font-bold mb-2">Debug Info:</p>
            {debugInfo.map((info, index) => (
              <p key={index} className="mb-1">
                {info}
              </p>
            ))}
          </div>

          <button
            onClick={() => {
              setLoading(false)
              setError("Manually stopped loading")
            }}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded text-sm"
          >
            Stop Loading
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>

          {/* Debug info */}
          <div className="text-left bg-gray-100 p-3 rounded text-xs max-h-40 overflow-y-auto mb-4">
            <p className="font-bold mb-2">Debug Info:</p>
            {debugInfo.map((info, index) => (
              <p key={index} className="mb-1">
                {info}
              </p>
            ))}
          </div>

          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-black text-white rounded-md">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!supabase) {
    return (
      <div className="max-w-sm mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Configuration Error</h2>
          <p className="text-gray-600">Supabase is not properly configured.</p>
        </div>
      </div>
    )
  }

  // Show login form if no user
  if (!user) {
    return <AuthForm isDarkMode={false} />
  }

  const themeClasses = isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"

  return (
    <div className={`max-w-sm mx-auto min-h-screen transition-all duration-300 ${themeClasses}`}>
      {/* Header */}
      <div className={`flex justify-between items-center p-4 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <div>
          <h1 className="text-xl font-bold">Let's Hang</h1>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Hey {user.name}! 👋</p>
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
          <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <LogOut className="w-4 h-4" />
          </button>
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
                  const goingCount = hang.attendees?.filter((a) => a.status === "going").length || 0

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
                              of {hang.max_attendees}
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
                          Hosted by {hang.host?.name || "Unknown"}
                        </div>
                      </div>

                      {/* RSVP Buttons */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => handleRSVP(hang.id, "going")}
                          className={`flex-1 text-sm py-2 px-3 rounded-md transition-all duration-200 ${
                            hang.user_rsvp === "going"
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
                            hang.user_rsvp === "maybe"
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
                            hang.user_rsvp === "not-going"
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

            <form onSubmit={handleCreateHang} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hang Title *</label>
                <input
                  name="title"
                  placeholder="What are you planning?"
                  className={`w-full px-3 py-2 border rounded-md ${
                    isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-black"
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    name="date"
                    type="date"
                    className={`w-full px-3 py-2 border rounded-md ${
                      isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-black"
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time *</label>
                  <input
                    name="time"
                    type="time"
                    className={`w-full px-3 py-2 border rounded-md ${
                      isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-black"
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <input
                  name="location"
                  placeholder="Where should everyone meet?"
                  className={`w-full px-3 py-2 border rounded-md ${
                    isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-black"
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  placeholder="Tell everyone what to expect..."
                  className={`w-full px-3 py-2 border rounded-md resize-none ${
                    isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-black"
                  }`}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Attendees</label>
                <input
                  name="maxAttendees"
                  type="number"
                  placeholder="10"
                  className={`w-full px-3 py-2 border rounded-md ${
                    isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-black"
                  }`}
                />
              </div>

              <button
                type="submit"
                className={`w-full px-4 py-3 rounded-md font-medium ${
                  isDarkMode ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
                }`}
              >
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
