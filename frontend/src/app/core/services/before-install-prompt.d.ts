interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface WindowEventMap {
	beforeinstallprompt: BeforeInstallPromptEvent;
}
