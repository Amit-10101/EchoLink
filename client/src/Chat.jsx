import React, { useContext, useEffect, useRef, useState } from 'react';
import { uniqBy } from 'lodash';
import axios from 'axios';

import Logo from './Logo.jsx';
import { UserContext } from './UserContext.jsx';
import Contact from './Contact.jsx';
import SendIcon from './assets/SendIcon.svg';
import UserIcon from './assets/UserIcon.svg';
import LogoutIcon from './assets/LogoutIcon.svg';
import MenuIcon from './assets/MenuIcon.svg';
import CloseIcon from './assets/CloseIcon.svg';
import ChatBubbleIcon from './assets/chat-bubble.png';
import FileAttachmentIcon from './assets/FileAttachmentIcon.svg';

const Chat = () => {
	const [ws, setWs] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState({});
	const [offlineUsers, setOfflineUsers] = useState({});
	const [selectedUserId, setSelectedUserId] = useState(null);
	const [newMessageText, setNewMessageText] = useState('');
	const [messages, setMessages] = useState([]);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [messageIsFile, setMessageIsFile] = useState(false);
	const { username, id, setUsername, setId } = useContext(UserContext);
	const divUnderMessages = useRef();

	useEffect(() => {
		connectToWs();
	}, [selectedUserId]);

	const connectToWs = () => {
		const ws = new WebSocket('ws://localhost:4040');
		setWs(ws);

		ws.addEventListener('message', handleMessage);
		ws.addEventListener('close', () => {
			setTimeout(() => {
				// console.log('Reconnecting...');
				connectToWs();
			}, 1000);
		});
	};

	const handleMessage = (event) => {
		const messageData = JSON.parse(event.data);
		if ('online' in messageData) {
			showOnlineUsers(messageData.online);
		} else if ('text' in messageData) {
			if (messageData.senderId === selectedUserId) {
				setMessages((prev) => [...prev, { ...messageData }]);
			}
		}
	};

	const showOnlineUsers = (usersArray) => {
		const users = {};
		usersArray.forEach(({ userId, username }) => {
			users[userId] = username;
		});
		setOnlineUsers(users);
	};

	const sendMessage = (e, file = null) => {
		if (e) {
			e.preventDefault();
		}
		ws.send(
			JSON.stringify({
				recipientId: selectedUserId,
				text: newMessageText,
				file,
			})
		);
		setNewMessageText('');
		setMessages((prev) => [
			...prev,
			{
				text: newMessageText || file.name,
				senderId: id,
				recipientId: selectedUserId,
				_id: Date.now(),
			},
		]);
	};

	const sendFile = (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			sendMessage(null, { name: file.name, data: reader.result });
		};
		setMessageIsFile(true);
	};

	useEffect(() => {
		if (selectedUserId) {
			axios.get(`/messages/${selectedUserId}`).then((res) => {
				setMessages(res.data);
			});
		}
		setMessageIsFile(false);
	}, [messageIsFile]);

	const logout = () => {
		axios
			.post('/logout')
			.then(() => {
				setWs(null);
				setUsername(null);
				setId(null);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	useEffect(() => {
		const div = divUnderMessages.current;
		if (div) {
			div.scrollIntoView({ behavior: 'smooth', block: 'end' });
		}
	}, [messages]);

	useEffect(() => {
		if (selectedUserId) {
			axios.get(`/messages/${selectedUserId}`).then((res) => {
				setMessages(res.data);
			});
		}
	}, [selectedUserId]);

	useEffect(() => {
		axios.get('/users').then((res) => {
			const offlineUsersArr = res.data
				.filter((user) => user._id !== id)
				.filter((user) => !Object.keys(onlineUsers).includes(user._id));

			const offlineUsersObj = {};
			offlineUsersArr.forEach((user) => {
				offlineUsersObj[user._id] = user.username;
			});
			setOfflineUsers(offlineUsersObj);
		});
	}, [onlineUsers]);

	const messagesWithoutDups = uniqBy(messages, '_id');

	return (
		<div className="flex h-screen max-md:flex-col">
			<div className="md:hidden h-16 bg-[#222831] border-none flex items-center py-3 px-6 justify-between">
				<h1 className="text-[#eeeeee] text-xl font-semibold">
					{onlineUsers[selectedUserId] || offlineUsers[selectedUserId]}
				</h1>
				<img
					src={isMenuOpen ? CloseIcon : MenuIcon}
					className="h-6 w-6 invert md:hidden cursor-pointer"
					alt="Menu Icon"
					onClick={() => setIsMenuOpen((prev) => !prev)}
				/>
			</div>
			<div
				className={`bg-[#EEEEEE] w-1/3 px-6 p-8 flex flex-col max-md:w-full ${
					!isMenuOpen && 'max-md:hidden ease-in-out duration-300'
				}`}
			>
				<div className="flex-grow">
					<Logo />

					{Object.keys(onlineUsers).map((userId) => (
						<React.Fragment key={userId}>
							{onlineUsers[userId] !== username && (
								<Contact
									userId={userId}
									selectedUserId={selectedUserId}
									setSelectedUserId={setSelectedUserId}
									username={onlineUsers[userId]}
									online={true}
								/>
							)}
						</React.Fragment>
					))}
					{Object.keys(offlineUsers).map((userId) => (
						<React.Fragment key={userId}>
							{offlineUsers[userId] !== username && (
								<Contact
									userId={userId}
									selectedUserId={selectedUserId}
									setSelectedUserId={setSelectedUserId}
									username={offlineUsers[userId]}
									online={false}
								/>
							)}
						</React.Fragment>
					))}
				</div>
				<div className="flex items-center bg-gray-300 rounded-full">
					<span className="flex-grow flex items-center gap-4 font-montserrat font-semibold text-lg text-[#222831] py-4 px-8">
						<img src={UserIcon} alt="User Icon" className="w-6 h-6" /> {username}
					</span>
					<button
						onClick={logout}
						className="font-semibold text-md bg-[#00ADB5] py-4 px-8 text-white rounded-full hover:bg-[#008d95] shadow-lg ease-in-out duration-300 h-full flex items-center gap-2"
					>
						<img src={LogoutIcon} alt="Logout Icon" className="w-6 h-6" />
						Logout
					</button>
				</div>
			</div>

			<div className="w-2/3 flex flex-col shadow shadow-[#adadad] max-md:w-full  max-md:flex-grow">
				<div className="bg-[#393E46] flex-grow py-2">
					{!selectedUserId ? (
						<div className="flex flex-col items-center justify-center h-full text-white text-xl font-semibold tracking-wide gap-8">
							<img
								src={ChatBubbleIcon}
								alt=""
								className="invert opacity-20 transform scale-x-[-1] h-[12rem]"
							/>
							<span className="opacity-40">Start a chat</span>
						</div>
					) : (
						<div className="relative h-full">
							<div className="overflow-auto absolute inset-0">
								{messagesWithoutDups.map((message, index) => (
									<div
										key={index}
										className={`flex my-2 items-center px-4 ${
											message.senderId == id ? 'justify-end' : 'justify-start'
										}`}
									>
										<div
											className={`py-5 px-8 max-w-lg rounded-lg ${
												message.senderId == id
													? 'bg-[#00ADB5] text-white self-end'
													: 'bg-[#EEEEEE] text-[#222831] self-start'
											}`}
										>
											{message.text}
											{message.isfile && (
												<div>
													<a
														href={
															axios.defaults.baseURL +
															'/file/' +
															message.fileName
														}
														target="_blank"
														rel="noreferrer noopener"
														className="flex items-center gap-2 border-b pb-1"
													>
														<img
															src={FileAttachmentIcon}
															alt="File Attachment Icon"
															className={`w-6 h-6 ${
																message.senderId == id && 'invert'
															}`}
														/>
														{message.fileName}
													</a>
												</div>
											)}
										</div>
									</div>
								))}
								<div ref={divUnderMessages}></div>
							</div>
						</div>
					)}
				</div>

				{selectedUserId && (
					<form
						onSubmit={sendMessage}
						className="flex items-center justify-evenly w-full p-6 gap-4 max-md:gap-3 max-md:p-4 bg-[#dfdfdf]"
					>
						<input
							type="text"
							placeholder="Type your message here"
							value={newMessageText}
							onChange={(e) => setNewMessageText(e.target.value)}
							className="py-4 px-8 flex-grow bg-white rounded-full border shadow focus:outline-none max-md:px-5"
						/>
						<label className="flex items-center justify-center cursor-pointer bg-gray-400 rounded-full py-4 px-5 bg-opacity-50 hover:bg-gray-400 ease-in-out duration-300 shadow max-md:px-4 max-md:h-full">
							<input
								type="file"
								name="attachment"
								className="hidden"
								onChange={sendFile}
							/>
							<img
								src={FileAttachmentIcon}
								alt="File Attachment Icon"
								className="w-6 h-6"
							/>
						</label>
						<button
							type="submit"
							className="bg-[#00ADB5] py-4 px-5 rounded-full hover:bg-[#008d95] ease-in-out duration-300 shadow-sm shadow-slate-400 disabled:opacity-50 disabled:hover:bg-[#00ADB5] max-md:px-4"
							{...(!newMessageText && { disabled: true })}
						>
							<img src={SendIcon} alt="Send Icon" className="w-6 h-6 text-white" />
						</button>
					</form>
				)}
			</div>
		</div>
	);
};

export default Chat;
