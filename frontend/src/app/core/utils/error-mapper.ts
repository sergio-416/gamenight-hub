const ERROR_CODE_TO_TRANSLATION_KEY = {
	GAME_ALREADY_IN_COLLECTION: 'errors.gameAlreadyInCollection',
	GAME_ALREADY_PLAYED: 'errors.gameAlreadyPlayed',
	GAME_NOT_FOUND: 'errors.gameNotFound',
	EVENT_NOT_FOUND: 'errors.eventNotFound',
	EVENT_FULL: 'errors.eventFull',
	NOT_A_PARTICIPANT: 'errors.notAParticipant',
	NOT_EVENT_OWNER: 'errors.notEventOwner',
	NOT_LOCATION_OWNER: 'errors.notLocationOwner',
	ALREADY_JOINED: 'errors.alreadyJoined',
	UNAUTHORIZED: 'errors.unauthorized',
	NO_TOKEN_PROVIDED: 'errors.unauthorized',
	INVALID_TOKEN: 'errors.unauthorized',
	ADMIN_REQUIRED: 'errors.forbidden',
	MODERATOR_REQUIRED: 'errors.forbidden',
	STORE_ORGANISER_REQUIRED: 'errors.forbidden',
	VALIDATION_FAILED: 'errors.validationFailed',
	INVALID_INTEGER: 'errors.validationFailed',
	INVALID_UUID: 'errors.validationFailed',
	PROFILE_NOT_FOUND: 'errors.profileNotFound',
	PROFILE_CREATE_FAILED: 'errors.generic',
	DUPLICATE_USERNAME: 'errors.duplicateUsername',
	NAME_CHANGE_COOLDOWN: 'errors.nameChangeCooldown',
	OPEN_EVENTS_EXIST: 'errors.openEventsExist',
	ACCOUNT_DELETE_FAILED: 'errors.generic',
	LOCATION_NOT_FOUND: 'errors.locationNotFound',
	LOCATION_REQUIRED: 'errors.validationFailed',
	BGG_API_ERROR: 'errors.bggApiError',
	BGG_GAME_NOT_FOUND: 'errors.gameNotFound',
	GENERIC_ERROR: 'errors.generic',
} as const;

type ApiErrorCode = keyof typeof ERROR_CODE_TO_TRANSLATION_KEY;

function isApiErrorCode(code: unknown): code is ApiErrorCode {
	return typeof code === 'string' && code in ERROR_CODE_TO_TRANSLATION_KEY;
}

export function mapErrorToTranslationKey(errorCode: string): string {
	if (isApiErrorCode(errorCode)) {
		return ERROR_CODE_TO_TRANSLATION_KEY[errorCode];
	}
	return 'errors.generic';
}
