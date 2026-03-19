import { Injectable, inject } from "@angular/core";
import {
	addDoc,
	collection,
	Firestore,
	serverTimestamp,
} from "@angular/fire/firestore";
import type { OrganiserRequest } from "@gamenight-hub/shared";

@Injectable({
	providedIn: "root",
})
export class OrganiserService {
	readonly #firestore = inject(Firestore);

	async submitRequest(request: OrganiserRequest): Promise<void> {
		await addDoc(collection(this.#firestore, "organiser_requests"), {
			...request,
			status: "pending",
			createdAt: serverTimestamp(),
		});
	}
}
