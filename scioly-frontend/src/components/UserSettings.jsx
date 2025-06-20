import { useState } from 'react'

const UserSettings = (props) => {
    const [newPass, setNewPass] = useState('')

    if (!props.user) {
        return
    }

    const handleReset = async (event) => {
        event.preventDefault()
        await props.handleReset(newPass)
        setNewPass('')
    }
    
    return (
        <div>
            <div>
                <p>{props.user.firstName} {props.user.lastName}'s settings</p>
            </div>
            <div>
                <p>Reset Password</p>
                <form onSubmit={handleReset}>
                    <div>
                        new password
                        <input type='password' value={newPass} onChange={({target}) => setNewPass(target.value)}></input>
                    </div>
                    <button type='submit'>reset</button>
                </form>
            </div>
            <button type='button' onClick={props.handleLogout}>Logout</button>
        </div>
    )
}

export default UserSettings