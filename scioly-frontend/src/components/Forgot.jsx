import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Forgot = (props) => {
    const [email, setEmail] = useState('')
    const navigate = useNavigate()

    const handleForgot = async (event) => {
        event.preventDefault()
        const res = await props.handleForgot(email)
        if (res) {
            setEmail('')
            navigate('/signin')
        }
    }

    return (
        <div>
            <h2>Forgot password</h2>
            <form onSubmit={handleForgot}>
                <div>
                    email
                    <input value={email} onChange={({target}) => setEmail(target.value)} />
                </div>
                <button type='submit'>reset password</button>
                <button type='button'><Link to='/signin'>cancel</Link></button>
            </form>
        </div>
    )
}

export default Forgot