import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import { Toast } from './components/ui.jsx'
import TopBar from './components/TopBar.jsx'
import BottomNav from './components/BottomNav.jsx'
import Onboarding from './components/Onboarding.jsx'
import TodayScreen from './screens/TodayScreen.jsx'
import GrowScreen from './screens/GrowScreen.jsx'
import ExploreScreen from './screens/ExploreScreen.jsx'
import ConnectScreen from './screens/ConnectScreen.jsx'
import PlayScreen from './screens/PlayScreen.jsx'
import './styles.css'

function AppInner() {
  const [tab, setTab] = useState('today')
  const { profile, loading } = useApp()

  const nav = (t) => { setTab(t); window.scrollTo(0, 0) }

  if (loading) {
    return (
      <div className="shell" style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '10px' }}>🌱</div>
          <p>Loading your Novie...</p>
        </div>
      </div>
    )
  }

  const onboarded = profile?.onboarded

  return (
    <>
      {!onboarded && <Onboarding />}
      <div className="shell">
        <TopBar onNav={nav} />
        <main>
          {tab === 'today' && <TodayScreen onNav={nav} />}
          {tab === 'grow' && <GrowScreen onNav={nav} />}
          {tab === 'explore' && <ExploreScreen onNav={nav} />}
          {tab === 'connect' && <ConnectScreen onNav={nav} />}
          {tab === 'play' && <PlayScreen onNav={nav} />}
        </main>
      </div>
      <BottomNav tab={tab} onNav={nav} />
      <ToastWithCtx />
    </>
  )
}

function ToastWithCtx() {
  const { toast } = useApp()
  return <Toast message={toast} />
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
