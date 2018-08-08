'use strict'

const Alexa = require('ask-sdk');
 
const SKILL_NAME = 'ゆで卵タイマー';
const which_heater = 'IHを使用しますか？ガスを使用しますか？';

const heater_list = [
    'ガス',
    'アイエイチ'
]

let skill;
exports.handler = async function (event, context) {
    if (!skill) {
      skill = Alexa.SkillBuilders.custom()
        .addRequestHandlers(
            LaunchRequestHandler,
            CookingHeaterHandler,
            StopIntentHandler,
            SessionEndedRequestHandler,
            ErrorHandler
        )
        .create();
    }
    return skill.invoke(event);
}


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest';
    },

    handle(handlerInput) {
        const launch_message = '一緒に美味しいゆで卵を作りましょう。';
        const ask_message = 'IHかガスと言ってください。';

        return handlerInput.responseBuilder
            .speak(launch_message + which_heater)
            .reprompt(ask_message)
            .getResponse();
    }
};

const CookingHeaterHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
            && request.intent.name === 'CookingHeaterIntent');
    },
    handle(handlerInput) {

        const ask_heater = handlerInput.requestEnvelope.request.intent.slots.Heater.value;
        const heater_message = ask_heater + 'ですね。';

        if(heater_list.indexOf(ask_heater) > -1){
            return handlerInput.responseBuilder
                .speak(heater_message)
                .getResponse();
        }else{
            return handlerInput.responseBuilder
                .speak('もう一度言ってください')
                .reprompt(which_heater)
                .getResponse();
        }
    }
};

const StopIntentHandler = {

    canHandle(handlerInput){
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
        && (request.intent.name === 'AMAZON.StopIntent'
        ||  request.intent.name === 'AMAZON.CancelIntent'
        ||  request.intent.name === 'AMAZON.NoIntent');
    },

    handle(handlerInput){
        return handlerInput.responseBuilder
                .speak()
                .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle(handlerInput, error){
        return true;
    },
    
    handle(handlerInput, error){
        return handlerInput.responseBuilder
            .speak('うまくいきませんでした、ごめんなさい。')
            .getResponse();
    }
}