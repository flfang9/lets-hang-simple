"use client"

import { useState } from "react"
import { Plus, Sun, Moon } from 'lucide-react'

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <div className={`min-h-screen py-10 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="container mx-auto max-w-2xl px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🎉 Let's Hang</h1>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-200">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Welcome to Let's Hang!</h2>
          <p className="text-gray-600 mb-6">Plan hangouts with friends easily</p>
          <button className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800">
            <Plus className="w-4 h-4 inline mr-2" />
            Create Your First Hang
          </button>
        </div>
      </div>
    </div>
  )
}
