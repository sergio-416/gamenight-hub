import { importProvidersFrom } from "@angular/core";
import { TranslocoTestingModule } from "@jsverse/transloco";

const EN_SHARED = {
	header: {
		logoAlt: "GameNight Hub Logo",
		toggleNav: "Toggle navigation",
		nav: {
			collection: "Collection",
			gameNights: "Game Nights",
			calendar: "Calendar",
			stats: "Stats",
			notifications: "Notifications",
		},
		login: "Login",
		ariaNotifications: "Notifications",
		ariaProfile: "My profile",
		avatarAlt: "User avatar",
		xpLevel: "XP Level",
	},
	footer: {
		brandName: "GameNight Hub",
		nav: { terms: "Terms", privacy: "Privacy", support: "Support" },
		bggAlt: "BoardGameGeek",
	},
	xp: {
		badge: {
			levelShort: "Lv.{{ level }}",
			tooltip:
				"Level {{ level }} \u00b7 {{ title }} \u00b7 {{ current }}/{{ next }} XP",
			ariaLabel: "XP Level",
		},
		feedback: {
			xpAwarded: "+{{ amount }} XP",
			levelUp: "Level Up! \u2192 Level {{ level }}",
		},
		toast: { levelUp: "Level Up!" },
		history: {
			emptyState: "No XP earned yet. Start adding games!",
			loadMore: "Load more",
			loading: "Loading...",
			xpAmount: "+{{ amount }} XP",
			actions: {
				gameAdded: "Added a game",
				eventCreated: "Created an event",
				participantJoined: "Joined an event",
			},
			timeAgo: {
				justNow: "Just now",
				minutesAgo: "{{ count }}m ago",
				hoursAgo: "{{ count }}h ago",
				daysAgo: "{{ count }}d ago",
				monthsAgo: "{{ count }}mo ago",
			},
		},
	},
	common: {
		search: "Search...",
		searchLabel: "Search",
		clearSearch: "Clear search",
	},
	auth: { signIn: "Sign In", signOut: "Sign Out", login: "Login" },
	languageSwitcher: {
		switchTo: "Switch to {{ lang }}",
		label: "Select language",
	},
	levelTitles: {
		1: "Wandering Pawn",
		2: "Curious Collector",
		3: "Apprentice Archivist",
		4: "Tavern Regular",
		5: "Guild Member",
		6: "Seasoned Strategist",
		7: "Lorekeeper",
		8: "Knight of the Table",
		9: "High Chamberlain",
		10: "Archmage of the Table",
	},
	notifications: { newEvent: "New event: {{ title }}" },
	errors: {
		generic: "Something went wrong. Please try again.",
		gameAlreadyInCollection: "This game is already in your collection.",
		gameAlreadyPlayed: "This game is already in your played history.",
		gameNotFound: "Game not found.",
		eventNotFound: "Event not found.",
		eventFull: "This event is full.",
		notAParticipant: "You are not a participant in this event.",
		notEventOwner: "You do not have permission to modify this event.",
		notLocationOwner: "You do not have permission to modify this location.",
		alreadyJoined: "You have already joined this event.",
		unauthorized: "You must be signed in to do that.",
		forbidden: "You do not have permission to perform this action.",
		validationFailed: "Invalid input. Please check your data.",
		profileNotFound: "Profile not found.",
		duplicateUsername: "This username is already taken.",
		nameChangeCooldown: "You can only change your name once every 30 days.",
		openEventsExist:
			"Please close your open events before deleting your account.",
		locationNotFound: "Location not found.",
		bggApiError:
			"BoardGameGeek is temporarily unavailable. Please try again later.",
	},
};

const EN_HOME = {
	hero: {
		titleBefore: "Ready for your next ",
		titleHighlight: "adventure",
		titleAfter: "?",
		subtitle:
			"Discover local game nights or host your own session. Create your collection. Play.",
		imageAlt: "Cosy board game night with warm ambient lighting",
		cta: {
			explore: "Start Exploring",
			host: "Host Session",
			browse: "Browse Events",
		},
	},
	features: {
		perks: {
			title: "Member Perks",
			description:
				"Unlock exclusive benefits and rewards as you grow your community presence",
			link: "Learn more \u2192",
		},
		xp: {
			title: "XP & Levels",
			description:
				"Earn experience points for every game night and watch your level climb",
			link: "Learn more \u2192",
		},
		achievements: {
			title: "Achievements",
			description:
				"Collect badges that showcase your gaming milestones and dedication",
			link: "Learn more \u2192",
		},
	},
	support: {
		title: "Need assistance, Traveler?",
		subtitle: "We're here to help you navigate your journey",
		hub: "Support Hub",
		rules: "Community Rules",
	},
};

const EN_AUTH = {
	login: {
		subtitle: "Sign in to continue",
		googleSigningIn: "Signing in...",
		googleSignIn: "Sign in with Google",
		googleSigningInAria: "Signing in with Google",
		googleSignInAria: "Sign in with Google",
		divider: "Or",
		emailPlaceholder: "Your email",
		emailLabel: "Your email",
		continueWithEmail: "Continue with email",
		organiserPrompt: "Are you an event organiser?",
		organiserLink: "Apply here",
		organiserLinkAria: "Apply as event organiser",
	},
	waiting: {
		signedIn: {
			title: "You're signed in!",
			subtitle: "You can close this window now.",
		},
		checkInbox: {
			title: "Check your inbox",
			sentLinkTo: "We sent a sign-in link to",
			sentLinkGeneric: "We sent a sign-in link to your inbox.",
			spamHint: "Didn't receive it? Check your spam folder.",
			tryDifferent: "Try a different email",
			tryDifferentAria: "Try a different email",
		},
	},
	callback: {
		signingIn: "Signing you in\u2026",
		prompt: {
			instruction:
				"Please enter the email address you used to request the sign-in link.",
			emailPlaceholder: "Your email",
			emailLabel: "Your email",
			continue: "Continue",
		},
		error: {
			title: "Sign-in failed",
			backToLogin: "Back to login",
			backToLoginAria: "Back to login",
		},
	},
	register: {
		subtitle: "Register your organisation",
		reviewNotice:
			"Your application will be reviewed by our team before you can access the platform. We'll get in touch via email once it's approved.",
		orgNameLabel: "Organisation name",
		orgNamePlaceholder: "Organisation name",
		addressLabel: "Address",
		addressPlaceholder: "Address",
		emailLabel: "Your email",
		emailPlaceholder: "Your email",
		submitting: "Submitting...",
		submitApplication: "Submit Application",
		alreadyHaveAccount: "Already have an account?",
		signInLink: "Sign in",
		success: {
			title: "Application received!",
			message:
				"Thanks for applying! Our team will review your request and reach out to",
			messageSuffix: "once your organisation is approved.",
			backToHome: "Back to home",
		},
	},
};

const EN_STATS = {
	unauthenticated: {
		title: "Your Collection Insights",
		subtitle:
			"Visualise your board game collection with charts and analytics. Track growth over time, see complexity distribution, and explore what categories dominate your shelves. Sign in to unlock your stats.",
		signIn: "Sign in",
		createAccount: "Create an account",
		imageAlt: "Stats preview image coming soon",
		imagePlaceholder: "Image coming soon...",
		features: {
			categories: {
				title: "Categories",
				description:
					"See which game categories make up the bulk of your collection",
			},
			growth: {
				title: "Growth",
				description:
					"Track how your collection has grown month by month over time",
			},
			complexity: {
				title: "Complexity",
				description:
					"Understand the complexity spread across your entire library",
			},
		},
	},
	organiser: {
		title: "Store Organiser Statistics",
		eventsHosted: "Events Hosted",
		totalAttendees: "Total Attendees",
		popularGames: "Popular Games",
	},
	admin: {
		title: "Platform Analytics",
		totalUsers: "Total Users",
		totalEvents: "Total Events",
		totalGames: "Total Games",
	},
	collection: {
		title: "Collection Statistics",
		charts: {
			gamesByCategory: "Games by Category",
			collectionGrowth: "Collection Growth Over Time",
			complexityDistribution: "Complexity Distribution",
		},
		emptyState: {
			title: "No statistics yet",
			subtitle: "Add some games to see your collection analytics!",
		},
	},
	loading: "Loading statistics...",
	error: "Failed to load statistics",
};

const EN_GAME_NIGHTS = {
	title: "Game Nights",
	subtitle: "Upcoming board game events and where to find them!",
	addEvent: "ADD EVENT",
	showMap: "Show Map",
	hideMap: "Hide Map",
	loading: "Loading events...",
	eventsHeading: "Events",
	eventsFound: "{{ count }} events found",
	emptyLoggedIn:
		"No events found for this period. Try a different filter or create a new game night!",
	emptyLoggedOut:
		"No events found for this period. Try a different filter or log in to create one!",
	map: {
		heading: "Map",
		close: "Close",
		loadingLocations: "Loading locations...",
	},
	card: {
		full: "Full",
		joined: "{{ current }}/{{ max }} Joined",
		viewDetails: "View Details",
		viewDetailsAria: "View details for {{ title }}",
		waitlistOnly: "Waitlist Only",
	},
	preview: {
		closeAria: "Close preview",
		viewDetails: "View Details",
		viewDetailsAria: "View details for {{ title }}",
		full: "Full",
	},
	timeFilter: {
		thisWeek: "This Week",
		next7d: "Next 7 Days",
		next14d: "Next 14 Days",
		thisMonth: "This Month",
		all: "All Events",
		fallback: "Time",
	},
	categories: {
		all: "All Categories",
		strategy: "Strategy",
		rpg: "RPG",
		party: "Party",
		classic: "Classic",
		cooperative: "Co-op",
		trivia: "Trivia",
		miniatures: "Miniatures",
		family: "Family",
		other: "Other",
		fallback: "Category",
	},
	toast: {
		locationDeleted: "Location deleted",
		locationDeleteFailed: "Failed to delete location",
	},
};

const EN_CALENDAR = {
	loading: "Loading events...",
	error: "Failed to load events. Please try again later.",
	header: {
		today: "Today",
		newEvent: "+ New Event",
		prevMonth: "Previous month",
		nextMonth: "Next month",
		noEvents: "No game nights scheduled this month",
		eventCount: "You have {{ count }} game night scheduled this month",
		eventCountPlural: "You have {{ count }} game nights scheduled this month",
	},
	grid: {
		overflow: "+{{ count }} more",
	},
	details: {
		heading: "Event Details",
		upcoming: "Upcoming Events",
		eventsOn: "Events on {{ date }}",
		noEventsDay: "No events scheduled for this day",
		noEventsMonth: "No upcoming events this month",
		hostedBy: "Hosted by {{ username }}",
		playersMax: "{{ count }} players max",
		todayLabel: "Today",
	},
	weekdays: {
		sun: "Sun",
		mon: "Mon",
		tue: "Tue",
		wed: "Wed",
		thu: "Thu",
		fri: "Fri",
		sat: "Sat",
	},
	weekdaysShort: {
		sun: "S",
		mon: "M",
		tue: "T",
		wed: "W",
		thu: "T",
		fri: "F",
		sat: "S",
	},
	months: {
		0: "January",
		1: "February",
		2: "March",
		3: "April",
		4: "May",
		5: "June",
		6: "July",
		7: "August",
		8: "September",
		9: "October",
		10: "November",
		11: "December",
	},
};

const EN_CREATE_EVENT = {
	closeWizard: "Close wizard",
	stepAria: "Step {{ step }} of {{ total }}",
	stepGame: {
		title: "What are we playing?",
		subtitle: "Set the vibe for your game night",
		eventTitle: "Event Title *",
		eventTitlePlaceholder: "e.g. Friday Night Catan Strategy",
		description: "Short Description",
		descriptionPlaceholder:
			"Tell everyone what's special about this session...",
		charCount: "{{ current }}/500",
		category: "Category",
		gameFromCollection: "Game from Collection",
		coverImage: "Cover Image",
		changeCoverImage: "Change image",
		chooseCoverImage: "Choose Cover Image",
	},
	stepLocation: {
		title: "Where & When",
		subtitle: "Set the stage for your game night",
		privatePlace: "Private place",
		privatePlaceDesc: "Home or private address",
		publicVenue: "Public venue",
		comingSoon: "Coming soon",
		soon: "Soon",
		address: "Address *",
		addressPlaceholder: "Search address...",
		date: "Date *",
		time: "Time *",
		addEndTime: "Add end time",
		removeEndTime: "Remove end time",
		endDate: "End Date",
		endTime: "End Time",
	},
	stepPlayers: {
		title: "Who's coming?",
		subtitle: "Set the guest list for your session",
		maxPlayers: "Max Players",
		decreaseAria: "Decrease players",
		increaseAria: "Increase players",
		gameSupports: "This game supports {{ range }}",
		communityGuidelines:
			"By creating an event, you agree to our community guidelines. Be respectful, inclusive, and ensure a welcoming environment for all players.",
		tooltipHost: "This number includes you as the host",
	},
	nav: {
		back: "Back",
		continue: "Continue",
		createEvent: "Create Event",
		creating: "Creating...",
	},
	mapPanel: {
		heading: "Find the perfect spot for your game",
		subtitle: "Setting the right atmosphere is key to an epic session.",
	},
	coverPicker: {
		title: "Choose Cover Image",
		closeAria: "Close",
		cancel: "Cancel",
		confirm: "Confirm",
	},
	gamePicker: {
		searchPlaceholder: "Search your collection...",
		searchAria: "Search your game collection",
		clearAria: "Clear game selection",
		loading: "Loading collection...",
		noGames: "No games in your collection. Import from BGG first!",
		noMatches: "No matches found",
	},
	toast: {
		eventCreated: "Event created successfully",
		eventFailed: "Failed to create event. Please try again.",
		invalidEventData: "Invalid event data",
	},
};

const EN_FEATURE_TOUR = {
	layout: {
		prevAria: "Previous feature page",
		nextAria: "Next feature page",
		backToHome: "\u2190 Back to home",
	},
	perks: {
		title: "Member Perks",
		description:
			"GameNight Hub members get exclusive access to features built for serious board game enthusiasts.",
		howItWorks: {
			title: "How it works",
			createAccount: {
				title: "Create your account",
				description: "Sign up and join a growing community",
			},
			completeProfile: {
				title: "Complete your profile",
				description: "Set up your game preferences",
			},
			unlockAccess: {
				title: "Unlock exclusive access",
				description: "Get instant access to member-only features",
			},
		},
		whatYouUnlock: {
			title: "What you unlock",
			items: {
				priorityRegistration: "Priority event registration",
				membersOnly: "Members-only game nights",
				votingRights: "Community voting rights",
				earlyAccess: "Early access to new features",
				collectionTracking: "Personal game collection tracking",
			},
			srLabel: "feature perk",
		},
	},
	xp: {
		title: "XP & Levels",
		description:
			"Earn experience points every time you engage with the community.",
		howYouEarn: {
			title: "How you earn XP",
			hostGameNight: {
				title: "Host a game night",
				description: "Organise an event and bring players together",
			},
			rsvp: { title: "RSVP to an event", description: "Show up and play" },
			completeProfile: {
				title: "Complete your profile",
				description: "Fill in your preferences",
			},
		},
		milestones: {
			title: "Level milestones",
			items: {
				apprentice: "Level 1 \u2013 Apprentice (0 XP)",
				strategist: "Level 5 \u2013 Strategist (250 XP)",
				gameMaster: "Level 10 \u2013 Game Master (1000 XP)",
				grandMaster: "Level 20 \u2013 Grand Master (5000 XP)",
			},
			srLabel: "feature perk",
		},
	},
	badges: {
		title: "Achievements",
		description: "Earn badges by staying active in the community.",
		howYouEarn: {
			title: "How you earn badges",
			earlyAdopter: {
				title: "Be an early adopter",
				description: "Join before the public launch",
			},
			hostFirst: {
				title: "Host your first game night",
				description: "Create and run your first event",
			},
			buildCollection: {
				title: "Build your collection",
				description: "Add 10 or more games",
			},
		},
		showcase: {
			title: "Badge showcase",
			items: {
				earlyAdopter: "Early Adopter",
				gameMaster: "Game Master",
				socialButterfly: "Social Butterfly",
				collector: "Collector",
				partyStarter: "Party Starter",
			},
			srLabel: "feature perk",
		},
	},
};

const EN_EVENTS = {
	loading: "Loading event\u2026",
	notFound: "Event not found.",
	backToGameNights: "Back to Game Nights",
	categoryNight: "{{ label }} Night",
	hostedBy: "Hosted by {{ name }}",
	templateRating: "TEMPLATE: \u2605 4.9 rating \u00b7 12 Events Hosted",
	templateMessageHost: "TEMPLATE: Message Host",
	youAreHost: "You're the Host",
	leaving: "Leaving\u2026",
	leaveEvent: "Leave Event",
	joining: "Joining\u2026",
	eventFull: "Event Full",
	joinGame: "Join Game",
	signInToJoin: "Sign in to Join",
	aboutThisEvent: "About this Event",
	ownerZone: "Owner Zone",
	editEvent: "Edit Event",
	delete: "Delete",
	edit: {
		titleLabel: "Title",
		titlePlaceholder: "Event title",
		descriptionLabel: "Description",
		descriptionPlaceholder: "Event description",
		coverImageLabel: "Cover Image",
		coverPreviewAlt: "Cover preview",
		changeCover: "Change",
		chooseCoverImage: "Choose cover image",
		maxPlayersLabel: "Max Players",
		maxPlayersPlaceholder: "Number of players",
		startTimeLabel: "Start Time",
		addEndTime: "Add end time",
		cancel: "Cancel",
		saving: "Saving\u2026",
		saveChanges: "Save Changes",
	},
	deleteConfirm: {
		message: "Are you sure? This action cannot be undone.",
		deleting: "Deleting\u2026",
		yesDelete: "Yes, delete",
		cancel: "Cancel",
	},
	templateMapPreview: "TEMPLATE: Map Preview",
	location: "Location",
	postalCode: "CP {{ code }}",
	templateGetDirections: "TEMPLATE: Get Directions",
	playersJoined: "Players Joined",
	playerAlt: "Player",
	urgency: {
		joined: "{{ count }} joined",
		full: "Event Full",
		spotsLeftSingular: "{{ count }} spot left!",
		spotsLeftPlural: "{{ count }} spots left!",
	},
	infoPill: {
		category: "Category",
		weight: "Weight",
		playingTime: "Playing Time",
		players: "Players",
		minSuffix: "min",
	},
	editWarning: {
		tooManyPlayers:
			"This game supports up to {{ max }} players \u2014 you've set {{ current }}",
		tooFewPlayers:
			"This game requires at least {{ min }} players \u2014 you've set {{ current }}",
	},
	toast: {
		eventUpdated: "Event updated",
		eventUpdateFailed: "Failed to save changes",
		eventDeleted: "Event deleted",
		eventDeleteFailed: "Failed to delete event",
		eventDeleteForbidden: "You do not have permission to delete this event",
		joinedEvent: "Joined event!",
		joinFailed: "Failed to join event",
		leftEvent: "Left event",
		leaveFailed: "Failed to leave event",
		hostCannotLeave: "Event host cannot leave their own event",
		invalidInput: "Invalid input",
	},
};

const EN_COLLECTION = {
	header: {
		title: "My Collection",
		subtitleSingular:
			"You have {{ count }} game in your library. Keep playing!",
		subtitlePlural: "You have {{ count }} games in your library. Keep playing!",
		addGame: "Add Game",
	},
	toolbar: {
		searchPlaceholder: "Search collection...",
		searchAriaLabel: "Search games in collection",
		gridView: "Grid view",
		listView: "List view",
	},
	empty: {
		noGamesFound: "No games found",
		tryAdjusting: "Try adjusting your search or filters",
		collectionEmpty: "Your collection is empty",
		startBuilding: "Start building your tabletop library",
		importFirst: "Import your first game",
	},
	list: { players: "Players", min: "min", loadMore: "Load More Games" },
	confirmRemove: {
		title: "Remove Game",
		message: "Are you sure you want to remove this game from your collection?",
		confirm: "Remove",
		cancel: "Cancel",
	},
	unauthenticated: {
		heading: "Your Board Game Collection",
		description:
			"Import games from BoardGameGeek, track what you own, and get AI-powered recommendations tailored to your library. Sign in to start building your collection.",
		signIn: "Sign in",
		createAccount: "Create an account",
		imagePlaceholder: "Image coming soon...",
		featureImportTitle: "Import",
		featureImportDesc:
			"Search BoardGameGeek and add any game to your personal library in seconds",
		featureDiscoverTitle: "Discover",
		featureDiscoverDesc:
			"Get AI-powered game recommendations based on what you already own and love",
		featureTrackTitle: "Track",
		featureTrackDesc:
			"See stats and insights across your entire collection at a glance",
	},
	addToLibrary: {
		title: "Add to Library",
		subtitle: "Expand your tabletop collection",
	},
	import: {
		back: "\u2190 Back",
		pageTitle: "Add a Game to Your Collection",
		searchPlaceholder: "Search for a game (e.g., Catan, Ticket to Ride)...",
		searchAriaLabel: "Search for board games",
		searching: "Searching...",
		search: "Search",
		year: "Year",
		rank: "Rank",
		na: "N/A",
		unranked: "Unranked",
		inCollection: "In Collection",
		importing: "Importing...",
		importBtn: "Import",
		noGamesFound: "No games found. Try a different search.",
	},
	bggPreview: {
		backToSearch: "Back to Search",
		errorLoading: "Failed to load game details. Please try again.",
		alreadyInCollection: "Already in Collection",
		importingEllipsis: "Importing...",
		addToCollection: "Add to Collection",
		players: "Players",
		minSuffix: "Min",
		agePlus: "Age {{ age }}+",
		aboutTheGame: "About the Game",
		publisher: "Publisher:",
		year: "Year:",
		dataPoweredBy: "Data powered by",
		bgg: "BoardGameGeek",
	},
	gameDetail: {
		backToCollection: "Back to Collection",
		errorLoading: "Failed to load game details. Please try again.",
		addToCollection: "Add to Collection",
		owned: "Owned",
		removeFromCollection: "Remove from collection",
		wishlistGame: "Wishlist Game",
		players: "Players",
		minSuffix: "Min",
		agePlus: "Age {{ age }}+",
		aboutTheGame: "About the Game",
		publisher: "Publisher:",
		year: "Year:",
		dataPoweredBy: "Data powered by",
		bgg: "BoardGameGeek",
	},
	statCards: {
		complexity: "Complexity",
		rating: "Rating",
		rank: "Rank",
		weight: "Weight",
		na: "N/A",
	},
	tags: {
		expansion: "Expansion",
		categories: "Categories",
		mechanics: "Mechanics",
	},
	recommendations: {
		title: "More in your Collection",
		addToLibrary: "Add to Library",
		expandCollection: "Expand your tabletop collection",
	},
	tabs: {
		all: "All Games",
		recentlyAdded: "Recently Added",
		owned: "Owned",
		wishlist: "Wishlist",
	},
	status: {
		owned: "Owned",
		wantToPlay: "Want to Play",
		wantToTry: "Want to Try",
		played: "Played",
	},
	weight: {
		1: "Light",
		2: "Light-Medium",
		3: "Medium",
		4: "Medium-Heavy",
		5: "Heavy",
		notRated: "Not rated",
	},
	card: {
		playersSingular: "{{ count }} Player",
		playersPlural: "{{ count }} Players",
		playersRange: "{{ min }}-{{ max }} Players",
	},
	removeConfirmMessage:
		'Remove "{{ name }}" from your collection? This can\'t be undone.',
	toast: { gameRemoved: "Game removed from collection" },
};

const EN_PROFILE = {
	loading: "Loading your profile\u2026",
	loadingPublic: "Loading profile\u2026",
	noUsernameSet: "No username set",
	public: "Public",
	private: "Private",
	memberSince: "Member since {{ date }}",
	noBio: "No bio yet \u2014 tell the world about yourself!",
	profileSettings: "Profile Settings",
	levelAndXp: "Level & XP",
	stats: {
		title: "Stats",
		eventsJoined: "Events Joined",
		eventsHosted: "Events Hosted",
		gamesOwned: "Games Owned",
	},
	badges: { title: "Badges", comingSoon: "Coming soon!" },
	gameCollection: {
		title: "Game Collection",
		noGames: "No games yet",
		ownedGamesAppear: "Your owned games will appear here",
	},
	wantToPlay: {
		title: "Want to Play",
		empty: "Games you want to play at events",
	},
	wantToTry: {
		title: "Want to Try",
		empty: "Games you're curious about",
		cancel: "Cancel",
		update: "Update",
		markAsPlayed: "Mark as Played",
	},
	contact: { title: "Contact" },
	visibility: {
		title: "Visibility",
		publicProfile: "Public profile",
		location: "Location",
		email: "Email",
		phone: "Phone",
		birthday: "Birthday",
		collection: "Collection",
		on: "On",
		off: "Off",
		visible: "Visible",
		hidden: "Hidden",
		changeSettings: "Change visibility settings \u2192",
	},
	settings: {
		title: "Settings",
		editProfile: "Edit Profile",
		cancel: "Cancel",
		saving: "Saving\u2026",
		saveChanges: "Save changes",
		username: "Username",
		bio: "Bio",
		locationLabel: "Location",
		name: "Name",
	},
	xpHistory: { title: "XP History" },
	account: {
		title: "Account Settings",
		signOut: "Sign out",
		signOutDesc: "Sign out of your account on this device.",
		signOutBtn: "Sign out",
		deleteAccount: "Delete Account",
		deleteAccountDesc:
			"Permanently delete your account, profile, and all associated data. This action cannot be undone.",
		deleteAccountBtn: "Delete Account",
	},
	privateModal: {
		title: "Make your profile private?",
		keepPublic: "Keep it public",
		makePrivate: "Make private",
	},
	publicProfile: {
		notFoundTitle: "Profile not found",
		notFoundDesc: "This profile is private or doesn't exist.",
		browseGameNights: "Browse game nights",
		badgesAndCollection: "Badges & Game Collection",
		comingSoon: "This player's gaming history will appear here soon!",
	},
	setup: {
		welcome: "Welcome to GameNight Hub!",
		welcomeDesc:
			"Set up your profile so other players can find and know you. You can always update this later.",
	},
};

export function provideTranslocoTesting() {
	return importProvidersFrom(
		TranslocoTestingModule.forRoot({
			langs: {
				en: {
					...EN_SHARED,
					home: EN_HOME,
					auth: EN_AUTH,
					"game-nights": EN_GAME_NIGHTS,
					calendar: EN_CALENDAR,
					"create-event": EN_CREATE_EVENT,
					stats: EN_STATS,
					"feature-tour": EN_FEATURE_TOUR,
					events: EN_EVENTS,
					collection: EN_COLLECTION,
					profile: EN_PROFILE,
				},
			},
			translocoConfig: {
				availableLangs: ["en", "es", "ca", "fr", "de", "pt", "it"],
				defaultLang: "en",
			},
			preloadLangs: true,
		}),
	);
}
