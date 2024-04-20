import { useContext } from 'react';

import RegisterAndLogin from './RegisterAndLogin';
import { UserContext } from './UserContext';
import Chat from './Chat';

const Routes = () => {
	const { username, id } = useContext(UserContext);

	return <>{username && id ? <Chat /> : <RegisterAndLogin />}</>;
};

export default Routes;
