import AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
    const { email, password } = JSON.parse(event.body);

    const authParams = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: '5nll5jclhg3n39s1msb3fu1169', 
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password
        }
    };

    try {
        // Authenticate user with Cognito
        const response = await cognito.initiateAuth(authParams).promise();
        
        // Query DynamoDB to get user_id from email
        const userParams = {
            TableName: 'Users',
            IndexName: 'EmailIndex', // Use a GSI if you have one for querying by email
            KeyConditionExpression: 'Email = :Email',
            ExpressionAttributeValues: {
                ':Email': email
            }
        };

        const userResponse = await dynamoDb.query(userParams).promise();
        console.log(userResponse);
        const userType = userResponse.Items[0].UserType;

        return {
            statusCode: 200,
            body: JSON.stringify({
                accessToken: response.AuthenticationResult.AccessToken,
                refreshToken: response.AuthenticationResult.RefreshToken,
                idToken: response.AuthenticationResult.IdToken,
                userType: userType
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
};
