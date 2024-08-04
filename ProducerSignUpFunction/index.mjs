import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  const {email, password, userType } = JSON.parse(event.body);
  try {
    // Create user in Cognito
    const params = {
      UserPoolId: 'us-east-2_Kr7OljY42',
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email }
      ],
      TemporaryPassword: password
    };

    await cognito.adminCreateUser(params).promise();

    // Set the permanent password
    const setPasswordParams = {
      UserPoolId: 'us-east-2_Kr7OljY42',
      Username: email,
      Password: password,
      Permanent: true
    };
    await cognito.adminSetUserPassword(setPasswordParams).promise();

    // Initiate Auth to get tokens
    const authParams = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      UserPoolId: 'us-east-2_Kr7OljY42',
      ClientId: '5nll5jclhg3n39s1msb3fu1169',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      }
    };

    const authResponse = await cognito.adminInitiateAuth(authParams).promise();

    const { AccessToken, RefreshToken, IdToken } = authResponse.AuthenticationResult;
    console.log(AccessToken, RefreshToken, IdToken);

    const uniqueId = uuidv4();
    // Store additional details in DynamoDB
    const userItem = {
      user_id: uniqueId,
      Email: email,
      UserType: userType 
    };

    console.log(userItem);

    await dynamoDb.put({
      TableName: "Users",
      Item: userItem
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ accessToken: AccessToken, refreshToken: RefreshToken, idToken: IdToken, userType: "Producer" }),
    };
  } catch (error) {
    if (error.code === 'UsernameExistsException') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email already exists' }),
      };
    }
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error signing up user' }),
    };
  }
};
