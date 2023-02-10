
import * as AWS from "@aws-sdk/client-budgets";
import { ZabbixSender } from "./ZabbixSender.js";
import * as dotenv from 'dotenv' ;
dotenv.config();

const RefreshInterval = parseInt(process.env.REFRESH_INTERVAL!);
const Budgets = (process.env.BUDGETS)?.split(',');
const AwsRegion = process.env.AWS_REGION;
const AwsAccountId = process.env.AWS_ACCOUNT_ID;
const ZbxHost = process.env.ZABBIX_HOST!;

// ZABBIX SENDER
const zbxSender = new ZabbixSender(ZbxHost);

// AWS CLIENT
const awsClient = new AWS.Budgets({region: AwsRegion});

console.log("Listing all Budgets..");

async function CheckBudget(budgetName : string, zbxHostName: string) { 
    const data = await awsClient.describeBudget({
        BudgetName: budgetName,
        AccountId: AwsAccountId
    });

    if(data.Budget !== undefined) {
        const budgetLimit = parseFloat(data.Budget.BudgetLimit!.Amount!);
        const spend = parseFloat(data.Budget.CalculatedSpend!.ActualSpend!.Amount!);
        const percSpend = (spend / budgetLimit) * 100;
    
        console.log('Budget: %s spend %f of %f [%d %]', budgetName, spend, budgetLimit, percSpend);

        // Sends to the Zabbix 
        await zbxSender.add('budget.limit.amount', budgetLimit, zbxHostName).send();
        await zbxSender.add('budget.spend.amount', spend, zbxHostName).send();
        await zbxSender.add('budget.spend.perc', percSpend, zbxHostName).send();
    }
}

async function CheckAllBudgets() {
    console.log("Checking all budgets..");
    
    for (let index = 0; index < Budgets!.length; index++) {
        const cfg = Budgets![index];                
        const name = cfg.split(':');

        console.log("Checking: %s", name[0]);
        await CheckBudget(encodeURIComponent(name[0]), name[1]);
    }
}

CheckAllBudgets();

setInterval(() => CheckAllBudgets(), RefreshInterval * 1000);