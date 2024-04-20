import Avatar from './Avatar';

const Contact = ({ userId, selectedUserId, setSelectedUserId, username, online }) => {
	return (
		<div
			key={userId}
			onClick={() => setSelectedUserId(userId)}
			className={`flex gap-6 my-2 items-center hover:bg-gray-300 py-4 px-4 rounded-lg ease-in-out duration-[0.25s] cursor-pointer border-b border-slate-300 ${
				selectedUserId === userId && 'bg-gray-300'
			}`}
		>
			<Avatar online={online} userId={userId} username={username} />{' '}
			<span className="text-[#222831">{username}</span>
		</div>
	);
};

export default Contact;
