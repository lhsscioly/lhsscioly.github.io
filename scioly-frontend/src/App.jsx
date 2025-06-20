import { useState, useEffect } from 'react'
import Home from './components/Home'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import Events from './components/Events'
import Forgot from './components/Forgot'
import UserSettings from './components/UserSettings'
import Reset from './components/Reset'
import userService from './services/users'
import loginService from './services/login'
import { Routes, Route, Link, useMatch, useNavigate } from 'react-router-dom'

function App() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [notif, setNotif] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loggedUser = localStorage.getItem('loggedAppUser')
    if (loggedUser) {
      const user = JSON.parse(loggedUser)
      setUser(user)
      userService.setToken(user.token)
    }
  }, [])

  const handleSignUp = async (credentials) => {
    try {
      const user = await userService.createUser(credentials)
      window.localStorage.setItem('loggedAppUser', JSON.stringify(user))
      setUser(user)
      userService.setToken(user.token)
      navigate('/')
      console.log('Sign Up')
      setNotif('signed up successfully, please check your email to verify your email')
      setTimeout(() => {
        setNotif(null)
      }, 3000)
      return true
    } catch (error) {
      if (error.response.data.error) {
        if (error.response.data.error === "Invalid admin key") {
          setError("invalid admin key")
        } else if (error.response.data.error === 'Path `password` is required') {
          setError("password is required")
        } else if (error.response.data.error.includes('Path `email` is required')) {
          setError("email is required")
        } else if (error.response.data.error.includes('Path `firstName` is required')) {
          setError("first name is required")
        } else if (error.response.data.error.includes('Path `lastName` is required')) {
          setError("last name is required")
        } else if (error.response.data.error === 'Path `password` is shorter than the minimum allowed length (8)') {
          setError("password must be at least 8 characters")
        } else if (error.response.data.error === 'expected `email` to be unique') {
          setError("email already taken")
        } else {
          console.log(error.response.data.error)
        }
      } else {
        console.log(error.message)
      }
      setTimeout(() => {
          setError(null)
      }, 3000)
    }
  }

  const handleLogout = () => {
    window.localStorage.removeItem('loggedAppUser')
    setUser(null)
    userService.setToken('')
    setNotif('logged out successfully')
    setTimeout(() => {
          setNotif(null)
    }, 3000)
  }

  const handleLogin = async (credentials) => {
    try {
      const user = await loginService.login(credentials)
      window.localStorage.setItem('loggedAppUser', JSON.stringify(user))
      setUser(user)
      userService.setToken(user.token)
      console.log('Sign In') 
      navigate('/')
      setNotif('logged in successfully')
      setTimeout(() => {
          setNotif(null)
      }, 3000)
      return true
    } catch (error) {
      if (error.status === 401) {
        setError('invalid username or password')
        setTimeout(() => {
          setError(null)
        }, 3000)
      } else if (error.status === 403) {
        setError('please verify your account by checking your email')
      }
    }
  }

  const handleReset = async (newPass) => {
    try {
      await userService.resetPass({ id: user.id, password: newPass })
      setNotif('reset password successfully')
      setTimeout(() => {
          setNotif(null)
      }, 3000)
    } catch (error) {
      if (error.response.data.error) {
        if (error.response.data.error === 'Path `password` is required') {
          setError("password is required")
        } else if (error.response.data.error === 'Path `password` is shorter than the minimum allowed length (8)') {
          setError("password must be at least 8 characters")
        } else if (error.status === 403) {
          setError("unauthorized")
        } else {
          console.log(error.response.data.error)
        }
      } else {
        console.log(error)
      }
      setTimeout(() => {
          setError(null)
      }, 3000)
    }
  }

  const handleForgot = async (email) => {
    try {
      await userService.forgot(email)
      setNotif('check your email for a reset link')
      setTimeout(() => {
        setNotif(null)
      }, 3000)
      return true
    } catch (error) {
      if (error.status === 404) {
        setError('email not found')
        setTimeout(() => {
          setError(null)
        }, 3000)
      } else {
        console.log(error)
      }
    }
  }

  const handleEmailReset = async (token, password) => {
    try {
      await userService.resetEmailPass(token, password)
      setNotif('password reset successfully')
      setTimeout(() => {
        setNotif(null)
      }, 3000)
    } catch (error) {
      if (error.response.data.error) {
        if (error.response.data.error === 'Path `password` is required') {
          setError("password is required")
        } else if (error.response.data.error === 'Path `password` is shorter than the minimum allowed length (8)') {
          setError("password must be at least 8 characters")
        } else if (error.response.data.error === 'Invalid or expired token') {
          setError("Invalid or expired token")
        } else {
          console.log(error.response.data.error)
        }
      } else {
        console.log(error.message)
      }
      setTimeout(() => {
          setError(null)
      }, 3000)
    }
  }

  return (
    <>
      <div>
        <button><Link to='/'>Home</Link></button>
        <button><Link to='/events'>Events</Link></button>
        {user ? <button><Link to='/settings'>Settings</Link></button>
        : <>
          <button><Link to='/signin'>Sign In</Link></button>
          <button><Link to='/signup'>Sign Up</Link></button>
        </>}
      </div>
      <div>{error}{notif}</div>
      <Routes>
        <Route path='/' element={ <Home /> } />
        <Route path='/signin' element={ <SignIn handleSignIn={handleLogin} setError={setError}/> } />
        <Route path='/signup' element={ <SignUp handleSignUp={handleSignUp} setError={setError} /> } />
        <Route path='/events' element={ <Events /> } />
        <Route path='/settings' element={ <UserSettings handleReset={handleReset} user={user} handleLogout={handleLogout} /> } />
        <Route path='/forgot' element={ <Forgot handleForgot={handleForgot} /> } />
        <Route path='/reset' element={ <Reset handleEmailReset={handleEmailReset} /> } />
      </Routes>
    </>
  )
}

export default App
