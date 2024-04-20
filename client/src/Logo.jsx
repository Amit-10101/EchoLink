import ChatIcon from './assets/chat-icon.png';

const Logo = () => {
	return (
		<div className="font-montserrat mb-9 px-2 w-full flex gap-6 max-md:gap-4 items-center h-[5rem]">
			<img src={ChatIcon} className="max-lg:h-2/3 lg:h-full" alt="Chat Icon" />
			<h1 className="text-5xl max-md:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-wide text-[#37546a] text-nowrap">
				EchoLink
			</h1>
		</div>
	);
};

export default Logo;
