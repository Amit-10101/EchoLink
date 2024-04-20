import axios from 'axios';
import { createContext, useEffect, useState } from 'react';

export const UserContext = createContext({});

export const UserContextProvider = ({ children }) => {
	const [username, setUsername] = useState(null);
	const [id, setId] = useState(null);

	useEffect(() => {
		axios
			.get('/profile', { withCredentials: true })
			.then(({ data }) => {
				setId(data.userId);
				setUsername(data.username);
			})
			.catch((err) => {
				console.log(err);
			});
	}, []);

	return (
		<UserContext.Provider value={{ username, setUsername, id, setId }}>
			{children}
		</UserContext.Provider>
	);
};
