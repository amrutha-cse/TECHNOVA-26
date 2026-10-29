import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const events = [
  { name: 'CodeSprint', type: 'CODING COMPETITION', description: 'Solve programming challenges and test your coding skills.', date: 'NOV 12, 2026', time: '10:00–11:00 AM', venue: 'Computer Lab 1', color: 'blue' },
  { name: 'WebCraft', type: 'WEB DEVELOPMENT', description: 'Create innovative and impressive web experiences.', date: 'NOV 12, 2026', time: '11:30 AM–1:00 PM', venue: 'Computer Lab 2', color: 'teal' },
  { name: 'TechTalk', type: 'PAPER PRESENTATION', description: 'Present your ideas and explore emerging technologies.', date: 'NOV 12, 2026', time: '1:00–2:00 PM', venue: 'Seminar Hall 1', color: 'burgundy' },
  { name: 'BrainByte', type: 'TECHNICAL QUIZ', description: 'Challenge your technical knowledge and quick thinking.', date: 'NOV 12, 2026', time: '2:00–3:00 PM', venue: 'Seminar Hall 2', color: 'purple' },
  { name: 'InnovateX', type: 'HACKATHON', description: 'Collaborate and transform ambitious ideas into solutions.', date: 'NOV 13, 2026', time: '10:00 AM–3:00 PM', venue: 'Computer Lab 3', color: 'green' },
]

const LOCAL_STORAGE_KEY = 'technova26_registrations'
const isLocalApp = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const API_BASE = 'http://localhost:5000'

function NeuralLandscape() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let width = 0
    let height = 0
    let frame
    let time = 0
    let nodes = []
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const spacing = width < 650 ? 65 : 85
      nodes = []
      for (let y = 0; y < height + spacing; y += spacing) {
        for (let x = 0; x < width + spacing; x += spacing) {
          nodes.push({ x, y, baseX: x, baseY: y, phase: Math.random() * 6, speed: 0.3 + Math.random() * 0.6 })
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      nodes.forEach((node) => {
        node.x = node.baseX + Math.sin(time * node.speed + node.phase) * 12
        node.y = node.baseY + Math.cos(time * node.speed + node.phase) * 10
      })
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const distance = Math.hypot(a.x - b.x, a.y - b.y)
          if (distance < (width < 650 ? 85 : 115)) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(78, 143, 210, ${(1 - distance / 115) * 0.25})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
        ctx.beginPath()
        ctx.arc(nodes[i].x, nodes[i].y, 1.3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(91, 178, 235, 0.55)'
        ctx.fill()
      }
      if (!reduceMotion) {
        time += 0.008
        frame = requestAnimationFrame(draw)
      }
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="neural-landscape" aria-hidden="true" />
}

function readLocalRegistrations() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocalRegistration(registration) {
  const current = readLocalRegistrations()
  const updated = [registration, ...current]
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  return updated
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [registrations, setRegistrations] = useState([])
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('All Events')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [showRegistration, setShowRegistration] = useState(false)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    full_name: '', mobile: '', email: '', college_name: '', branch: '', event_name: '', team_name: '', transaction_id: '',
  })

  function move(direction) {
    setActive((current) => (current + direction + events.length) % events.length)
  }

  function getPosition(index) {
    let difference = (index - active + events.length) % events.length
    if (difference > Math.floor(events.length / 2)) difference -= events.length
    return difference
  }

  function openAdmin() {
    setShowAdmin(true)
    setPassword('')
    setPasswordError('')
    setAdminUnlocked(false)
    setAdminError('')
    setSearch('')
    setSelectedEvent('All Events')
  }

  async function checkPassword(event) {
    event.preventDefault()
    if (password !== '1234') {
      setPasswordError('Incorrect password. Please try again.')
      return
    }
    setAdminUnlocked(true)
    setPasswordError('')
    setAdminLoading(true)
    setAdminError('')
    try {
      if (isLocalApp) {
        const response = await fetch(`${API_BASE}/api/registrations`)
        if (!response.ok) throw new Error('Could not load registrations from the backend.')
        setRegistrations(await response.json())
      } else {
        setRegistrations(readLocalRegistrations())
      }
    } catch {
      setAdminError('Could not reach the local backend. Showing registrations saved in this browser instead.')
      setRegistrations(readLocalRegistrations())
    } finally {
      setAdminLoading(false)
    }
  }

  async function refreshRegistrations() {
    setAdminLoading(true)
    setAdminError('')
    try {
      if (isLocalApp) {
        const response = await fetch(`${API_BASE}/api/registrations`)
        if (!response.ok) throw new Error('Unable to load registrations.')
        setRegistrations(await response.json())
      } else {
        setRegistrations(readLocalRegistrations())
      }
    } catch {
      setAdminError('Could not reach the backend. Showing browser-saved registrations instead.')
      setRegistrations(readLocalRegistrations())
    } finally {
      setAdminLoading(false)
    }
  }

  function closeAdmin() {
    setShowAdmin(false)
    setAdminUnlocked(false)
    setPassword('')
    setPasswordError('')
    setSearch('')
  }

  function registerNow() {
    setSuccess(null)
    setFormError('')
    setForm((previous) => ({ ...previous, event_name: events[active].name }))
    navigate('/register')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateForm(event) {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'event_name' && value !== 'InnovateX' ? { team_name: '' } : {}),
    }))
  }

  async function submitRegistration(event) {
    event.preventDefault()
    setFormError('')
    const required = ['full_name', 'mobile', 'email', 'college_name', 'branch', 'event_name', 'transaction_id']
    if (required.some((key) => !String(form[key] || '').trim())) {
      setFormError('Please fill in all required fields.')
      return
    }
    if (!/^[0-9+\-\s]{10,15}$/.test(form.mobile.trim())) {
      setFormError('Please enter a valid mobile number.')
      return
    }
    if (form.event_name === 'InnovateX' && !form.team_name.trim()) {
      setFormError('Team name is required for InnovateX.')
      return
    }

    setSubmitting(true)
    try {
      let result
      if (isLocalApp) {
        let response
        try {
          response = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          })
        } catch {
          throw new Error('Cannot connect to the backend. Make sure the server on port 5000 is running.')
        }
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Registration failed. Please try again.')
        result = data
      } else {
        const cleanedTeam = form.event_name === 'InnovateX' ? form.team_name.trim().replace(/\s+/g, ' ') : ''
        const current = readLocalRegistrations()
        let role = ''
        if (form.event_name === 'InnovateX') {
          const teamMembers = current.filter((item) => item.event_name === 'InnovateX' && String(item.team_name || '').trim().replace(/\s+/g, ' ').toLowerCase() === cleanedTeam.toLowerCase())
          if (teamMembers.length >= 4) throw new Error('This team already has four participants.')
          role = teamMembers.length === 0 ? 'Leader' : 'Member'
        }
        const registrationId = `TN26-${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`
        const record = {
          ...form,
          team_name: cleanedTeam || null,
          team_role: role || null,
          registration_id: registrationId,
          registered_at: new Date().toISOString(),
        }
        saveLocalRegistration(record)
        result = { registrationId, eventName: form.event_name }
      }

      setSuccess({ registrationId: result.registrationId, eventName: result.eventName || form.event_name })
      setForm({
        full_name: '', mobile: '', email: '', college_name: '', branch: '', event_name: '', team_name: '', transaction_id: '',
      })
    } catch (error) {
      setFormError(error.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForAnother() {
    setSuccess(null)
    setFormError('')
    setShowRegistration(true)
    navigate('/register')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredRegistrations = registrations
    .filter((item) => selectedEvent === 'All Events' || item.event_name === selectedEvent)
    .filter((item) => {
      const query = search.trim().toLowerCase()
      if (!query) return true
      return [item.registration_id, item.full_name, item.mobile, item.email, item.college_name, item.branch, item.event_name, item.team_name, item.team_role]
        .some((value) => String(value || '').toLowerCase().includes(query))
    })
    .sort((a, b) => {
      const eventDifference = events.findIndex((event) => event.name === a.event_name) - events.findIndex((event) => event.name === b.event_name)
      if (eventDifference !== 0) return eventDifference
      if (a.event_name === 'InnovateX' && b.event_name === 'InnovateX') {
        const teamDifference = String(a.team_name || '').trim().toLowerCase().localeCompare(String(b.team_name || '').trim().toLowerCase())
        if (teamDifference !== 0) return teamDifference
      }
      return String(a.full_name || '').localeCompare(String(b.full_name || ''))
    })

  function getTeamRowSpan(index) {
    const item = filteredRegistrations[index]
    if (item?.event_name !== 'InnovateX' || !String(item.team_name || '').trim()) return 1
    const teamKey = String(item.team_name).trim().replace(/\s+/g, ' ').toLowerCase()
    const previous = filteredRegistrations[index - 1]
    if (previous?.event_name === 'InnovateX' && String(previous.team_name || '').trim().replace(/\s+/g, ' ').toLowerCase() === teamKey) return 0
    let span = 1
    for (let next = index + 1; next < filteredRegistrations.length; next += 1) {
      const candidate = filteredRegistrations[next]
      if (candidate.event_name !== 'InnovateX' || String(candidate.team_name || '').trim().replace(/\s+/g, ' ').toLowerCase() !== teamKey) break
      span += 1
    }
    return span
  }

  if (location.pathname === '/register') {
    return (
      <div className="app registration-page">
        <div className="background-grid" aria-hidden="true" />
        <NeuralLandscape />
        <div className="digital-rain" aria-hidden="true">
          {'01010110100110100101101001011010'.split('').map((digit, index) => (
            <span key={index} style={{ '--i': index }}>{digit}</span>
          ))}
        </div>
        <header className="navbar">
          <button className="logo logo-home-button" onClick={() => navigate('/')} aria-label="Go to homepage">
            <span className="logo-mark">T</span>
            <span>TECHNOVA <span className="logo-year">'26</span></span>
          </button>
          <nav>
            <button className="nav-link" onClick={() => navigate('/')}>Back to Home</button>
          </nav>
        </header>
        <main className="registration-page-main">
          <button className="secondary-button registration-back" onClick={() => navigate('/')}>← Back to Events</button>
          <section className="registration-panel registration-panel-page" id="registration-form">
            <div className="registration-panel-heading">
              <p className="section-overline">OFFICIAL EVENT REGISTRATION</p>
              <h2>Register for <span>TECHNOVA '26</span></h2>
              <p>Fill in your details below. All fields are required except Team Name for non-hackathon events.</p>
            </div>
            <form className="registration-form" onSubmit={submitRegistration}>
              <label>Full Name<input name="full_name" value={form.full_name} onChange={updateForm} placeholder="Enter your full name" required /></label>
              <label>Mobile Number<input name="mobile" value={form.mobile} onChange={updateForm} inputMode="tel" maxLength="15" placeholder="Enter mobile number" required /></label>
              <label>Email Address<input name="email" type="email" value={form.email} onChange={updateForm} placeholder="name@example.com" required /></label>
              <label>College Name<input name="college_name" value={form.college_name} onChange={updateForm} placeholder="Enter your college name" required /></label>
              <label>Branch
                <select name="branch" value={form.branch} onChange={updateForm} required>
                  <option value="">Select branch</option><option value="CSE">CSE</option><option value="AIDS">AIDS</option><option value="ECE">ECE</option><option value="EEE">EEE</option>
                </select>
              </label>
              <label>Event
                <select name="event_name" value={form.event_name} onChange={updateForm} required>
                  <option value="">Select event</option>{events.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
              </label>
              <label className={form.event_name === 'InnovateX' ? '' : 'field-disabled'}>Team Name {form.event_name === 'InnovateX' ? '(Required)' : '(InnovateX only)'}
                <input name="team_name" value={form.team_name} onChange={updateForm} disabled={form.event_name !== 'InnovateX'} required={form.event_name === 'InnovateX'} placeholder="Enter your team name" />
              </label>
              <label>Transaction ID<input name="transaction_id" value={form.transaction_id} onChange={updateForm} placeholder="Enter payment transaction ID" required /></label>
              {form.event_name === 'InnovateX' && <p className="form-note full-width">InnovateX teams must have 2–4 participants. Each participant must submit a separate registration using exactly the same team name.</p>}
              {formError && <p className="form-error full-width" role="alert">{formError}</p>}
              <div className="form-actions full-width">
                <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Registration'} <span>→</span></button>
                <button className="secondary-button" type="button" onClick={() => { setFormError(''); navigate('/') }}>Cancel</button>
              </div>
            </form>
          </section>
        </main>
        <footer><p>INNOVATE. CREATE. ELEVATE.</p><span>© 2026 TECHNOVA</span></footer>
        {success && (
          <div className="modal-overlay" role="presentation">
            <section className="info-modal success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title">
              <div className="success-icon">✓</div>
              <p className="modal-tag">REGISTRATION CONFIRMED</p>
              <h2 id="success-title">You're registered!</h2>
              <p className="modal-description">Your registration for <strong>{success.eventName}</strong> was successful.</p>
              <div className="registration-id-box"><span>YOUR REGISTRATION ID</span><strong>{success.registrationId}</strong></div>
              <p className="form-note">Please save your registration ID for future reference.</p>
              <div className="success-actions">
                <button className="primary-button" onClick={() => { setSuccess(null); setShowRegistration(false); navigate('/') }}>Go Back to Home</button>
                <button className="secondary-button" onClick={resetForAnother}>Submit Another Form</button>
              </div>
            </section>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app" id="home">
      <div className="background-grid" aria-hidden="true" />
      <NeuralLandscape />
      <div className="digital-rain" aria-hidden="true">
        {'01010110100110100101101001011010'.split('').map((digit, index) => (
          <span key={index} style={{ '--i': index }}>{digit}</span>
        ))}
      </div>

      <header className="navbar">
        <a className="logo" href="#home">
          <span className="logo-mark">T</span>
          <span>TECHNOVA <span className="logo-year">'26</span></span>
        </a>
        <nav>
          <button className="nav-link" onClick={openAdmin}>View Registered Participants</button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="hero-overline">TECHNICAL FEST · NOVEMBER 2026</p>
          <h1>TECHNOVA <span>'26</span></h1>
          <p className="hero-description">Explore technology. Discover your potential. Be part of the innovation.</p>
        </section>

        <section className="events-section" id="events">
          <div className="section-heading">
            <div>
              <p className="section-overline">FIND YOUR CHALLENGE</p>
              <h2>Explore the <span>Events.</span></h2>
            </div>
          </div>

          <div className="carousel">
            <button className="carousel-arrow" onClick={() => move(-1)} aria-label="Previous event">←</button>
            <div className="carousel-stage">
              {events.map((item, index) => {
                const position = getPosition(index)
                const scale = position === 0 ? 1 : Math.abs(position) === 1 ? 0.68 : 0.48
                return (
                  <article
                    key={item.name}
                    className={`event-card ${item.color} ${position === 0 ? 'active-card' : ''}`}
                    style={{ '--offset': `${position * 24}%`, '--scale': scale, '--distance': Math.abs(position) }}
                    aria-hidden={position !== 0}
                    inert={position !== 0}
                  >
                    <div className="card-top">
                      <span className="event-number">EVENT 0{index + 1} / 05</span>
                      <span className="event-type">{item.type}</span>
                    </div>
                    <div className="card-content">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                    </div>
                    <div className="event-details">
                      <div><span>DATE</span><strong>{item.date}</strong></div>
                      <div><span>TIME</span><strong>{item.time}</strong></div>
                      <div><span>VENUE</span><strong>{item.venue}</strong></div>
                    </div>
                    {item.name === 'InnovateX' && (
                      <div className="team-info">
                        <span>GROUP EVENT</span>
                        <strong>2–4 MEMBERS</strong>
                        <button className="card-button" onClick={() => setShowInfo(true)} tabIndex={position === 0 ? 0 : -1}>
                          Team Rules & Details <span>↗</span>
                        </button>
                      </div>
                    )}
                    {position === 0 && <button className="primary-button card-register" onClick={registerNow}>Register for {item.name} <span>→</span></button>}
                  </article>
                )
              })}
            </div>
            <button className="carousel-arrow" onClick={() => move(1)} aria-label="Next event">→</button>
          </div>
          <div className="carousel-footer"><p className="carousel-hint">USE THE ARROWS TO EXPLORE</p></div>
        </section>

        <section className="registration-cta" id="registration">
          <p className="cta-overline">YOUR NEXT CHALLENGE STARTS HERE</p>
          
          <p>Choose your event and be part of TECHNOVA '26.</p>
          <button className="primary-button register-button" onClick={registerNow}>Register Now <span>→</span></button>
        </section>

        {showRegistration && (
          <section className="registration-panel" id="registration-form">
            <div className="registration-panel-heading">
              <p className="section-overline">OFFICIAL EVENT REGISTRATION</p>
              <h2>Register for <span>TECHNOVA '26</span></h2>
              <p>Fill in your details below. All fields are required except Team Name for non-hackathon events.</p>
            </div>
            <form className="registration-form" onSubmit={submitRegistration}>
              <label>Full Name<input name="full_name" value={form.full_name} onChange={updateForm} placeholder="Enter your full name" required /></label>
              <label>Mobile Number<input name="mobile" value={form.mobile} onChange={updateForm} inputMode="tel" maxLength="15" placeholder="Enter mobile number" required /></label>
              <label>Email Address<input name="email" type="email" value={form.email} onChange={updateForm} placeholder="name@example.com" required /></label>
              <label>College Name<input name="college_name" value={form.college_name} onChange={updateForm} placeholder="Enter your college name" required /></label>
              <label>Branch
                <select name="branch" value={form.branch} onChange={updateForm} required>
                  <option value="">Select branch</option><option value="CSE">CSE</option><option value="AIDS">AIDS</option><option value="ECE">ECE</option><option value="EEE">EEE</option>
                </select>
              </label>
              <label>Event
                <select name="event_name" value={form.event_name} onChange={updateForm} required>
                  <option value="">Select event</option>{events.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
              </label>
              <label className={form.event_name === 'InnovateX' ? '' : 'field-disabled'}>Team Name {form.event_name === 'InnovateX' ? '(Required)' : '(InnovateX only)'}
                <input name="team_name" value={form.team_name} onChange={updateForm} disabled={form.event_name !== 'InnovateX'} required={form.event_name === 'InnovateX'} placeholder="Enter your team name" />
              </label>
              <label>Transaction ID<input name="transaction_id" value={form.transaction_id} onChange={updateForm} placeholder="Enter payment transaction ID" required /></label>
              {form.event_name === 'InnovateX' && <p className="form-note full-width">InnovateX teams must have 2–4 participants. Each participant must submit a separate registration using exactly the same team name.</p>}
              {formError && <p className="form-error full-width" role="alert">{formError}</p>}
              <div className="form-actions full-width">
                <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Registration'} <span>→</span></button>
                <button className="secondary-button" type="button" onClick={() => { setShowRegistration(false); setFormError('') }}>Cancel</button>
              </div>
            </form>
          </section>
        )}
      </main>

      <footer><p>INNOVATE. CREATE. ELEVATE.</p><span>© 2026 TECHNOVA</span></footer>

      {showInfo && (
        <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowInfo(false) }}>
          <section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-title">
            <button className="modal-close" onClick={() => setShowInfo(false)} aria-label="Close">×</button>
            <p className="modal-tag">TECHNOVA '26 · HACKATHON</p>
            <h2 id="info-title">InnovateX</h2>
            <p className="modal-description">Work together, solve real-world problems, and turn your ideas into innovative solutions.</p>
            <div className="modal-info-row"><span>Date</span><strong>November 13, 2026</strong></div>
            <div className="modal-info-row"><span>Time</span><strong>10:00 AM – 3:00 PM</strong></div>
            <div className="modal-info-row"><span>Venue</span><strong>Computer Lab 3</strong></div>
            <div className="team-rules">
              <h3>Team Registration Rules</h3>
              <p>Each team must have 2–4 participants.</p>
              <p>The first person registering a new team becomes its leader.</p>
              <p>Every participant must register individually.</p>
              <p>All members must enter the same team name.</p>
              <p>A team cannot have more than four participants.</p>
            </div>
            <button className="primary-button modal-done" onClick={() => setShowInfo(false)}>Close</button>
          </section>
        </div>
      )}

      {showAdmin && (
        <div className="modal-overlay admin-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAdmin() }}>
          <section className={`info-modal admin-modal ${adminUnlocked ? 'participants-modal' : ''}`} role="dialog" aria-modal="true" aria-labelledby="admin-title">
            <button className="modal-close" onClick={closeAdmin} aria-label="Close">×</button>
            {!adminUnlocked ? (
              <>
                <p className="modal-tag">RESTRICTED ACCESS</p>
                <h2 id="admin-title">Registered Participants</h2>
                <p className="modal-description">Enter the access password to view the participant list.</p>
                <form onSubmit={checkPassword}>
                  <label className="password-label" htmlFor="admin-password">Password</label>
                  <input id="admin-password" className="password-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoComplete="current-password" required />
                  {passwordError && <p className="password-error">{passwordError}</p>}
                  <button className="primary-button modal-done" type="submit">Continue <span>→</span></button>
                </form>
              </>
            ) : (
              <>
                <p className="modal-tag">ACCESS GRANTED</p>
                <h2 id="admin-title">Registered Participants</h2>
                <p className="modal-description">Registration records from {isLocalApp ? 'the TECHNOVA database' : 'this browser'}.</p>
                <div className="participants-toolbar">
                  <input className="participants-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, mobile, event, team…" aria-label="Search participants" />
                  <button className="secondary-button" onClick={refreshRegistrations} disabled={adminLoading}>Refresh</button>
                </div>
                <div className="event-filter-list" aria-label="Filter participants by event">
                  {['All Events', ...events.map((item) => item.name)].map((eventName) => (
                    <button
                      key={eventName}
                      type="button"
                      className={`event-filter-button ${selectedEvent === eventName ? 'selected' : ''}`}
                      onClick={() => setSelectedEvent(eventName)}
                      aria-pressed={selectedEvent === eventName}
                    >
                      {eventName}
                      {eventName === 'All Events' && <span>{registrations.length}</span>}
                      {eventName !== 'All Events' && <span>{registrations.filter((item) => item.event_name === eventName).length}</span>}
                    </button>
                  ))}
                </div>
                {adminLoading && <p className="dashboard-message">Loading registrations…</p>}
                {adminError && <p className="dashboard-warning">{adminError}</p>}
                {!adminLoading && <p className="participant-count">Showing {filteredRegistrations.length} of {registrations.length} registration(s) {selectedEvent !== 'All Events' ? `for ${selectedEvent}` : ''}</p>}
                {!adminLoading && filteredRegistrations.length === 0 ? (
                  <div className="empty-participants">No registrations found for this selection.</div>
                ) : (
                  <div className="participants-table-wrap">
                    <table className="participants-table">
                      <thead><tr><th>Registration ID</th><th>Participant</th><th>Mobile</th><th>Email</th><th>College</th><th>Branch</th><th>Event</th><th>Team Name</th><th>Role</th><th>Registered At</th></tr></thead>
                      <tbody>{filteredRegistrations.map((item, index) => {
                        const teamRowSpan = getTeamRowSpan(index)
                        return (
                          <tr key={item.registration_id || item.id || `${item.email}-${index}`}>
                            <td>{item.registration_id || '—'}</td>
                            <td>{item.full_name || '—'}</td>
                            <td>{item.mobile || '—'}</td>
                            <td>{item.email || '—'}</td>
                            <td>{item.college_name || '—'}</td>
                            <td>{item.branch || '—'}</td>
                            <td>{item.event_name || '—'}</td>
                            {teamRowSpan !== 0 && <td rowSpan={teamRowSpan} className={teamRowSpan > 1 ? 'merged-team-cell' : ''}>{item.team_name || '—'}{teamRowSpan > 1 && <small>{teamRowSpan} members</small>}</td>}
                            <td>{item.team_role || '—'}</td>
                            <td>{item.registered_at ? new Date(item.registered_at).toLocaleString() : '—'}</td>
                          </tr>
                        )
                      })}</tbody>
                    </table>
                  </div>
                )}
                <button className="primary-button modal-done" onClick={closeAdmin}>Close</button>
              </>
            )}
          </section>
        </div>
      )}

      {success && (
        <div className="modal-overlay" role="presentation">
          <section className="info-modal success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title">
            <div className="success-icon">✓</div>
            <p className="modal-tag">REGISTRATION CONFIRMED</p>
            <h2 id="success-title">You're registered!</h2>
            <p className="modal-description">Your registration for <strong>{success.eventName}</strong> was successful.</p>
            <div className="registration-id-box"><span>YOUR REGISTRATION ID</span><strong>{success.registrationId}</strong></div>
            <p className="form-note">Please save your registration ID for future reference.</p>
            <div className="success-actions">
              <button className="primary-button" onClick={() => { setSuccess(null); setShowRegistration(false); navigate('/') }}>Go Back to Home</button>
              <button className="secondary-button" onClick={resetForAnother}>Submit Another Form</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
