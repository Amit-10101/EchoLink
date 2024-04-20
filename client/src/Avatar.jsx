const Avatar = ({ userId, username, online }) => {
	const colors = [
		'bg-slate-500',
		'bg-green-500',
		'bg-blue-500',
		'bg-yellow-500',
		'bg-red-500',
		'bg-indigo-500',
		'bg-purple-500',
		'bg-pink-500',
		'bg-teal-500',
	];

	const userIdBase10 = parseInt(userId, 16);
	const color = colors[userIdBase10 % colors.length];

	return (
		<div
			className={`w-12 h-12 relative ${color} text-white flex items-center justify-center rounded-full`}
		>
			<h1>{username[0]}</h1>
			<div
				className={`absolute bottom-0 right-0 w-[0.8rem] h-[0.8rem] rounded-full  border border-white ${
					online ? 'bg-green-600' : 'bg-gray-400'
				}`}
			/>
		</div>
	);
};

export default Avatar;
