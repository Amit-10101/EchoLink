import axios from 'axios';
import { useContext, useState } from 'react';
import { UserContext } from './UserContext';

const RegisterAndLogin = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isLoginOrRegister, setIsLoginOrRegister] = useState('login');

	const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const { data } = await axios.post(`/${isLoginOrRegister}`, { username, password });
		setLoggedInUsername(username);
		setId(data.id);
	};

	return (
		<div className=" bg-[#393E46] h-screen flex items-center justify-center">
			<form
				className="w-96 mx-auto bg-slate-200 p-12 rounded-xl shadow-lg"
				onSubmit={handleSubmit}
			>
				<h1 className="font-bold text-3xl text-center mb-10">
					{isLoginOrRegister === 'register' ? 'Register' : 'Login'}
				</h1>
				<input
					type="text"
					placeholder="Username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="block w-full mb-4 p-4 rounded-md border bg-slate-100 shadow focus:outline-none"
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="block w-full mb-8 p-4 rounded-md border bg-slate-100 shadow focus:outline-none"
				/>
				<button className="bg-[#00ADB5] px-5 py-3 rounded-full text-white text-lg font-semibold hover:bg-[#008d95] ease-in-out duration-300 block mx-auto w-full">
					{isLoginOrRegister === 'register' ? 'Register' : 'Login'}
				</button>

				<p className="text-center mt-8">
					{isLoginOrRegister === 'register'
						? 'Already have an account?'
						: "Don't have an account?"}{' '}
					<span
						className="text-[#00ADB5] hover:text-[#008d95] cursor-pointer"
						onClick={() =>
							setIsLoginOrRegister(
								isLoginOrRegister === 'register' ? 'login' : 'register'
							)
						}
					>
						{isLoginOrRegister === 'register' ? 'Login' : 'Register'}
					</span>
				</p>
			</form>
		</div>
	);
};

export default RegisterAndLogin;
