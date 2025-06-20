import { useState } from 'react'
import { Link } from 'react-router-dom'

const SignIn = (props) => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSignIn = async (event) => {
        event.preventDefault()
        const result = await props.handleSignIn({ email, password })
        if (result) {
            setEmail('')
            setPassword('')
        }
    }

    return (
        <div>
            <h2>Sign In To LHS Scioly</h2>
            <form onSubmit={handleSignIn}>
                <div>
                    email
                    <input value={email} onChange={({target}) => setEmail(target.value)} />
                </div>
                <div>
                    password
                    <input type='password' value={password} onChange={({target}) => setPassword(target.value)} />
                </div>
                <button type='submit'>Sign In</button>
                <button type='button'>Don't have an account? <Link to='/signup' >Sign Up</Link> </button>
                <button type='button'><Link to='/forgot'>Forgot password?</Link></button>
            </form>
        </div>
    )
}

export default SignIn