const dxPushNotificationsController = require("./index");
const divbloxEndpointBase = require("divbloxjs/dx-core-modules/endpoint-base");
const DivbloxBase = require("divbloxjs/divblox");

/*
This package endpoint was generated by the divbloxjs package generator.
*/

class DxPushNotificationsEndpoint extends divbloxEndpointBase {
    /**
     * Initializes the result and declares the available operations
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the app configuration
     */
    constructor(dxInstance = null) {
        super(dxInstance);

        this.endpointName = "dxPushNotifications"; // Change this to set the actual url endpoint
        this.endpointDescription = "dxPushNotifications endpoint"; // Change this to be more descriptive of the endpoint
        this.controller = this.getControllerInstance();

        // You need to do this in order for the operation to be available on the endpoint.
        // Also, this declaration provides the necessary input for swagger ui present the docs for this
        const operations = this.handleOperationDeclarations();
        this.declareOperations(operations);

        // TODO: Declare any entity schemas here if needed
        // An example of how to declare entity schemas for swagger ui
        //this.declareEntitySchemas(["anEntityInYourDataModel"]);
    }

    getObjectSchema(itemSchema, wrapperKey) {
        if (typeof wrapperKey !== "undefined") {
            const returnSchema = { properties: {} };
            returnSchema.properties[wrapperKey] = {
                type: "object",
                properties: itemSchema,
            };
            return returnSchema;
        }
        return {
            type: "object",
            properties: itemSchema,
        };
    }

    /**
     * @returns {[]} An array of operation definitions to be passed to this.declareOperations()
     */
    handleOperationDeclarations() {
        let baseDeclarations = super.handleOperationDeclarations();

        const createPushSubscription = this.getOperationDefinition({
            operationName: "pushSubscription",
            allowedAccess: ["anonymous"], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
            operationSummary: "Add a new push subscription",
            operationDescription:
                "Stores the details of the provided push subscription (json string) for later use. <br>" +
                "Returns a unique index by which the subscription can be referenced. <br>" +
                "If a globalUniqueIdentifier is provided via the JWT, it will be associated with this push subscription automatically.",
            parameters: [
                this.getInputParameter({
                    name: "vapidPublicKey",
                    required: true,
                    description:
                        "Needs to match the server's VAPID public key to ensure that the client has the correct configuration",
                }),
            ],
            requestType: "POST", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
            requestSchema: this.getSchema({
                pushSubscriptionObject: this.getSchema({
                    endpoint: "string",
                    keys: this.getSchema({ p256dh: "string", auth: "string" }),
                }),
            }), // this.getSchema()
            responseSchema: this.getSchema({ message: "string", pushSubscriptionIndex: "string" }), // this.getSchema()
        });

        const removePushSubscription = this.getOperationDefinition({
            operationName: "pushSubscription",
            allowedAccess: ["anonymous"], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
            operationSummary: "Removes a push subscription",
            operationDescription:
                "If a global identifier is provided as part of the request header, it will be used to identify the push subscription. The request body is optional.",
            parameters: [
                this.getInputParameter({
                    name: "pushSubscriptionIndex",
                    required: false,
                    description: "The index provided when this subscription was stored.",
                }),
            ], // An array of this.getInputParameter()
            requestType: "DELETE", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
            requestSchema: this.getSchema({
                pushSubscriptionObject: this.getSchema({
                    endpoint: "string",
                    keys: this.getSchema({ p256dh: "string", auth: "string" }),
                }),
            }), // this.getSchema()
            responseSchema: this.getSchema({ message: "string" }), // this.getSchema()
        });

        const notifyPushSubscription = this.getOperationDefinition({
            operationName: "notifyPushSubscription",
            allowedAccess: ["super user"], // If this array does not contain "anonymous", a JWT token will be expected in the Auth header
            operationSummary: "Sends a new push notification to the given subscription.",
            operationDescription:
                "The parameters for the notification property in the request body my include anything that is available to the service worker showNotification() function. Reference: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification",
            parameters: [
                this.getInputParameter({
                    name: "pushSubscriptionIndex",
                    required: false,
                    description:
                        "The index provided when this subscription was stored. If not provided, this sends a message to all subscriptions",
                }),
            ], // An array of this.getInputParameter()
            requestType: "POST", // GET|POST|PUT|DELETE|OPTIONS|HEAD|PATCH|TRACE
            requestSchema: this.getSchema({
                notification: this.getSchema({
                    title: "string",
                    body: "string",
                    image: "string",
                    data: this.getSchema({ additionalData: "string" }),
                }),
            }), //this.getSchema({ endpoint: "string", expirationTime: "integer" }), // this.getSchema()
            responseSchema: this.getSchema({ message: "string" }), //this.getSchema({ message: "string" }), // this.getSchema()
        });

        const packages = [createPushSubscription, removePushSubscription, notifyPushSubscription];

        return [...baseDeclarations, ...packages];
    }

    /**
     * @returns {dxPushNotificationsController} An instance of the package's controller. Override here if a different controller should be instantiated
     */
    getControllerInstance() {
        return new dxPushNotificationsController(this.dxInstance);
    }

    async executeOperation(operation, request) {
        if (!(await super.executeOperation(operation, request))) {
            return false;
        }

        // Here we have to deal with our custom operations
        switch (operation) {
            case "pushSubscription":
                switch (request.method.toLowerCase()) {
                    case "post":
                        await this.createPushSubscription(request.body, request.query.vapidPublicKey);
                        break;
                    case "delete":
                        await this.removePushSubscription(request.body, request.query.pushSubscriptionIndex);
                        break;
                }
                break;
            case "notifyPushSubscription":
                if (request.query.pushSubscriptionIndex !== undefined) {
                    await this.notifyPushSubscription(request.query.pushSubscriptionIndex, request.body);
                } else {
                    await this.notifyAllPushSubscriptions(request.body);
                }
                break;
            default:
                return false;

            // TODO: Add additional cases here for each declared operation
        }

        return true;
    }

    /**
     * Handles the logic to store a push subscription
     * @param {*} data The post body data that contains the push subscription
     * @param {*} vapidPublicKey The VAPID key to validate that this push subscription is actually ours
     */
    async createPushSubscription(data, vapidPublicKey) {
        const pushSubscriptionIndex = await this.controller.savePushSubscription(
            data.pushSubscriptionObject,
            vapidPublicKey,
            this.currentGlobalIdentifier
        );
        if (pushSubscriptionIndex === -1) {
            this.setResult(false, this.controller.getLastError());
            return;
        }
        this.setResult(true, "Push subscription saved");
        this.addResultDetail({ pushSubscriptionIndex: pushSubscriptionIndex });
    }

    async removePushSubscription(data, pushSubscriptionIndex) {
        const options = { pushSubscriptionIndex: pushSubscriptionIndex };
        if (typeof data.pushSubscriptionObject !== undefined) {
            options["pushSubscriptionObject"] = data.pushSubscriptionObject;
        }
        if (this.currentGlobalIdentifier !== -1) {
            options["globalIdentifier"] = this.currentGlobalIdentifier;
        }

        if (!(await this.controller.deletePushSubscription(options))) {
            this.setResult(false, this.controller.getLastError());
            return;
        }

        this.setResult(true, "Push subscription removed");
    }

    async notifyPushSubscription(pushSubscriptionIndex, options) {
        if (
            !(await this.controller.deliverPushNotification({ pushSubscriptionIndex: pushSubscriptionIndex }, options))
        ) {
            this.setResult(false, this.controller.getLastError());
            return;
        }
        this.setResult(true, "Notification sent!");
    }

    async notifyAllPushSubscriptions(options) {
        if (!(await this.controller.deliverPushNotificationToAll(options))) {
            this.setResult(false, this.controller.getLastError());
            return;
        }
        this.setResult(true, "Notification sent!");
    }

    // TODO: Add implementations for each declared operation below
}

module.exports = DxPushNotificationsEndpoint;
