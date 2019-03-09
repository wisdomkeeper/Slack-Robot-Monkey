const slackEventsApi = require('@slack/events-api');
const { createMessageAdapter } = require('@slack/interactive-messages');
const SlackClient = require('@slack/client').WebClient;
const express = require('express');

const app = express();
const slack = new SlackClient(process.env.SLACK_ACCESS_TOKEN);
const slackEvents = slackEventsApi.createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET);

const blocks = require('./blocks')

app.use('/slack/onEvent', slackEvents.expressMiddleware());
app.use('/slack/onAction', slackInteractions.expressMiddleware());

app.get('/start/approval-notice', (req, res) => {
  slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL,
      blocks: blocks.approvalNotice.request
  })
  return res.send('starting interactive demo: approval notice')
})

slackInteractions.action({ type: 'button' }, (payload, respond) => {
  let execAction = payload.actions[0].value.split(':')
  
  let blueprint = execAction[0]
  let action = execAction[1]
  
  
  
  console.log(blueprint)
  console.log(action)
  
  return respond({
    blocks: blocks[blueprint][action]
  });
});


// *** Handle errors ***
slackEvents.on('error', (error) => {
  if (error.code === slackEventsApi.errorCodes.TOKEN_VERIFICATION_FAILURE) {
    // This error type also has a `body` propery containing the request body which failed verification.
    console.error(`An unverified request was sent to the Slack events Request URL. Request body: \
${JSON.stringify(error.body)}`);
  } else {
    console.error(`An error occurred while handling a Slack event: ${error.message}`);
  }
});

// Start the express application
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
