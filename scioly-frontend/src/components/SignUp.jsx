import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const SignUp = (props) => {

    const [email, setEmail] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [adminKey, setAdminKey] = useState('')
    const [admin, setAdmin] = useState(false)
    const navigate = useNavigate('')

    const handleSignUp = async (event) => {
        event.preventDefault()

        if (password !== confirmPassword) {
            props.setError('passwords do not match')
            setTimeout(() => {
                props.setError(null)
            }, 3000)
            return
        }

        const result = await props.handleSignUp({ email, firstName, lastName, password, adminKey })
        if (result) {
            setEmail('')
            setFirstName('')
            setLastName('')
            setPassword('')
            setConfirmPassword('') 
            setAdminKey('')
        }
    }

    return (
        <div>
            <h2>Sign Up For LHS Scioly</h2>
            <form onSubmit={handleSignUp}>
                <div>
                    email
                    <input value={email} onChange={({target}) => setEmail(target.value)} />
                </div>
                <div>
                    first name
                    <input value={firstName} onChange={({target}) => setFirstName(target.value)} />
                </div>
                <div>
                    last name
                    <input value={lastName} onChange={({target}) => setLastName(target.value)} />
                </div>
                <div>
                    password
                    <input type='password' value={password} onChange={({target}) => setPassword(target.value)} />
                </div>
                <div>
                    confirm password
                    <input type='password' value={confirmPassword} onChange={({target}) => setConfirmPassword(target.value)} />
                </div>
                {
                    admin 
                    ? <div>
                        admin key
                        <input type='password' value={adminKey} onChange={({target}) => setAdminKey(target.value)} />
                        <button onClick={() => setAdmin(false)}>cancel</button>
                      </div>
                    : <div>
                        <button onClick={() => setAdmin(true)} >I am a coach or captain</button>
                    </div>
                }
                <button type='submit'>Sign Up</button>
                <button type='button'>Already have an account? <Link to='/signin' >Sign In</Link> </button>
            </form>
        </div>
    )
}

export default SignUp