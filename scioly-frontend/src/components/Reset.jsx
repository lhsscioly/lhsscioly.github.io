import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Reset = (props) => {
    const [newPass, setNewPass] = useState('')
    const navigate = useNavigate()
    const query = new URLSearchParams(window.location.search)
    const token = query.get('token')

    if (!token) {
        return
    }

    const handleEmailReset = (event) => {
        event.preventDefault()
        const res = props.handleEmailReset(token, newPass)
        if (res) {
            setNewPass('')
            navigate('/signin')
        }
    }

    return (
        <div>
            <div>
                <p>reset your password</p>
            </div>
            <div>
                <form onSubmit={handleEmailReset}>
                    <div>
                        new password
                        <input type='password' value={newPass} onChange={({target}) => setNewPass(target.value)}></input>
                    </div>
                    <button type='submit'>reset</button>
                </form>
            </div>
        </div>
    )
}

export default Reset