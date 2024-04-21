const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const ws = require('ws');

const User = require('./Models/UserModal');
const Message = require('./Models/MessageModal');

const app = express();
const port = process.env.PORT || 4040;
dotenv.config();
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		credentials: true,
		origin: process.env.CLIENT_URL,
	})
);
mongoose.connect(process.env.MONGO_URL);

const jwtSecretKey = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const getUserData = async (req) => {
	return new Promise((resolve, reject) => {
		const { token } = req.cookies;

		if (token) {
			jwt.verify(token, jwtSecretKey, {}, (err, userData) => {
				if (err) reject(err);
				resolve(userData);
			});
		} else {
			reject('No token');
		}
	});
};

const notifyAboutOnlineUsers = () => {
	const clients = [...wss.clients];

	clients.forEach((client) => {
		client.send(
			JSON.stringify({
				online: clients.map((c) => ({ userId: c.userId, username: c.username })),
			})
		);
	});
};

app.get('/test', (req, res) => {
	res.json('Test OK');
});

app.get('/messages/:userId', async (req, res) => {
	const { userId } = req.params;
	const userData = await getUserData(req);
	const ourUserId = userData.userId;

	const messages = await Message.find({
		senderId: { $in: [userId, ourUserId] },
		receiverId: { $in: [userId, ourUserId] },
	}).sort({ createdAt: 1 });

	res.json(messages);
});

app.get('/users', async (req, res) => {
	const users = await User.find({}, { _id: 1, username: 1 });
	res.json(users);
});

app.get('/profile', async (req, res) => {
	const { token } = req.cookies;

	// if (!token) return res.status(401).json('Unauthorized');

	jwt.verify(token, jwtSecretKey, async (err, userData) => {
		// if (err) return res.status(401).json('Unauthorized');
		res.json(userData);
	});
});

app.post('/logout', (req, res) => {
	res.clearCookie('token').json('Logged out');
});

app.post('/login', async (req, res) => {
	const { username, password } = req.body;

	const foundUser = await User.findOne({ username });

	if (!foundUser) return res.status(401).json('Unauthorized');

	const passOk = bcrypt.compareSync(password, foundUser.password);

	if (!passOk) return res.status(401).json('Unauthorized');

	try {
		jwt.sign({ userId: foundUser._id, username }, jwtSecretKey, {}, (err, token) => {
			if (err) throw err;

			res.cookie('token', token, { sameSite: 'none', secure: true }).json({
				id: foundUser._id,
			});
		});
	} catch (err) {
		res.status(500).json(err);
	}
});

app.post('/register', async (req, res) => {
	const { username, password } = req.body;
	const hashedPassword = bcrypt.hashSync(password, bcryptSalt);

	try {
		const createdUser = await User.create({
			username: username,
			password: hashedPassword,
		});

		jwt.sign({ userId: createdUser._id, username }, jwtSecretKey, {}, (err, token) => {
			if (err) throw err;

			res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
				id: createdUser._id,
			});
		});
	} catch (err) {
		if (err) throw err;
		res.status(500).json('error');
	}
});

app.get('/file/:fileName', async (req, res) => {
	const { fileName } = req.params;
	const fileData = await Message.findOne({ fileName });
	if (!fileData) {
		res.status(404).send('File not found');
		return;
	}
	// Convert base64 string to binary
	const imgBuffer = Buffer.from(fileData.file, 'base64');

	// Set the headers
	res.writeHead(200, {
		'Content-Type': 'image/jpeg', // or whichever is the correct mime type
		'Content-Length': imgBuffer.length,
	});

	// Send the image
	res.end(imgBuffer);
});

const server = app.listen(4040, () => {
	console.log('Server is running on port 4040');
});

const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {
	connection.isAlive = true;

	connection.timer = setInterval(() => {
		connection.ping();

		connection.deathTimer = setTimeout(() => {
			connection.isAlive = false;
			connection.terminate();
			clearInterval(connection.timer);
			notifyAboutOnlineUsers();
		}, 1000);
	}, 5000);

	connection.on('pong', () => {
		clearTimeout(connection.deathTimer);
	});

	// Read username and userId from the encrypted cookie token for this connection
	const cookies = req.headers?.cookie?.split('; ').find((str) => str.startsWith('token='));

	if (cookies) {
		const token = cookies.split('=')[1];
		if (token) {
			try {
				jwt.verify(token, jwtSecretKey, {}, (err, userData) => {
					if (err) throw err;

					const { userId, username } = userData;
					connection.userId = userId;
					connection.username = username;
				});
			} catch (err) {
				console.log(err);
			}
		}
	}

	const clients = [...wss.clients];

	connection.on('message', async (message) => {
		const messageData = JSON.parse(message.toString());
		const { recipientId, text, file } = messageData;
		let fileName = null;
		let fileData = null;

		if (file) {
			const parts = file.name.split('.');
			const extension = parts[parts.length - 1];
			fileName = Date.now() + '.' + extension;
			fileData = file.data.split(';base64,')[1];
		}

		if (recipientId && text) {
			const messageDoc = await Message.create({
				senderId: connection.userId,
				receiverId: recipientId,
				text,
			});

			clients
				.filter((client) => client.userId === recipientId)
				.forEach((client) => {
					client.send(
						JSON.stringify({
							senderId: connection.userId,
							_id: messageDoc._id,
							recipientId,
							text,
						})
					);
				});
		} else if (recipientId && file) {
			const messageDoc = await Message.create({
				senderId: connection.userId,
				receiverId: recipientId,
				text,
				isfile: true,
				fileName,
				file: fileData,
			});

			clients
				.filter((client) => client.userId === recipientId)
				.forEach((client) => {
					client.send(
						JSON.stringify({
							senderId: connection.userId,
							_id: messageDoc._id,
							recipientId,
							text,
							file: fileName,
						})
					);
				});
		}
	});

	// Notify everyone about the online users (when someone connects)
	notifyAboutOnlineUsers();
});
