import axios from 'axios';

import { UserContextProvider } from './UserContext';
import Routes from './Routes';

const App = () => {
	// axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;
	axios.defaults.baseURL = 'https://echolink.onrender.com';
	axios.defaults.withCredentials = true;

	return (
		<UserContextProvider>
			<Routes />
		</UserContextProvider>
	);
};

export default App;
