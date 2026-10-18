import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import SplashScreen from './components/SplashScreen'
import MyTutorials from './pages/MyTutorials'
import TutorialChat from './pages/TutorialChat'
import Store from './pages/Store'
import Community from './pages/Community'
import Settings from './pages/Settings'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/tutorials" replace />} />
          <Route path="/tutorials" element={<MyTutorials />} />
          <Route path="/guide" element={<TutorialChat />} />
          <Route path="/store" element={<Store />} />
          <Route path="/community" element={<Community />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
