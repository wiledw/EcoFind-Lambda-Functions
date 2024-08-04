import AWS from 'aws-sdk';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
    const { TrashTypes } = JSON.parse(event.body);
    console.log(TrashTypes);

    if (!Array.isArray(TrashTypes) || TrashTypes.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid or missing TrashTypes" })
        };
    }

    // Construct the filter expression for multiple trash types
    const filterExpressions = TrashTypes.map((_, index) => `contains(TrashTypes, :TrashType${index})`).join(' OR ');
    const expressionAttributeValues = TrashTypes.reduce((acc, trashType, index) => {
        acc[`:TrashType${index}`] = trashType;
        return acc;
    }, {});

    // Define the parameters for the DynamoDB query
    const params = {
        TableName: 'Users', // Replace with your DynamoDB table name
        IndexName: 'UserTypeIndex', // Replace with the name of the GSI for user type
        KeyConditionExpression: 'UserType = :UserType',
        FilterExpression: filterExpressions,
        ExpressionAttributeValues: {
            ':UserType': 'consumer',
            ...expressionAttributeValues
        },
        ProjectionExpression: '#email, #loc, #companyName, #trashTypes',
        ExpressionAttributeNames: {
            '#email': 'Email',
            '#loc': 'Location',
            '#companyName': 'CompanyName',
            '#trashTypes': 'TrashTypes'
        }
    };

    try {
        // Query the database
        const result = await dynamoDb.query(params).promise();
        console.log(result);
        // Return the results
        return {
            statusCode: 200,
            body: JSON.stringify(result.Items)
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" })
        };
    }
};
