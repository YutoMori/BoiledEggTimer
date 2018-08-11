'use strict'

const Alexa = require('ask-sdk');
 
const SKILL_NAME = 'ゆで卵タイマー';
const which_heater = 'IHを使用しますか？ガスを使用しますか？';
const ask_heater_message = 'IHかガスと言ってください。';

const which_water = '水から作りますか？お湯から作りますか？';
const ask_water_message = '水かお湯と言ってください。'

const Again_Message = 'もう一度言ってください';

const heater_list = [
    'ガス',
    'アイエイチ'
]

const liquid_list = [
    '水',
    'お湯'
]

let skill;
exports.handler = async function (event, context) {
    if (!skill) {
      skill = Alexa.SkillBuilders.custom()
        .addRequestHandlers(
            LaunchRequestHandler,
            CookingHeaterHandler,
            WaterHandler,
            BoiledHandle,
            StopIntentHandler,
            SessionEndedRequestHandler,
            ErrorHandler
        )
        .create();
    }
    return skill.invoke(event);
};


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest';
    },

    handle(handlerInput) {
        const launch_message = '一緒に美味しいゆで卵を作りましょう。';

        return handlerInput.responseBuilder
            .speak(launch_message + which_heater)
            .reprompt(ask_heater_message)
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

            // heaterの種類を受け取ったらSessionAttributesに保存する
            handlerInput.attributesManager.setSessionAttributes({'att_heater': ask_heater});

            return handlerInput.responseBuilder
                .speak(heater_message + which_water)
                .reprompt(ask_heater_message)
                .getResponse();
        } else {
            return handlerInput.responseBuilder
                .speak(Again_Message)
                .reprompt(which_heater)
                .getResponse();
        }
    }
};

const WaterHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'WaterIntent';
    },
    handle(handlerInput) {
        const ask_water = handlerInput.requestEnvelope.request.intent.slots.Liquid.value;
        const water_message = ask_water + 'ですね。';
        const asked_heater = handlerInput.attributesManager.getSessionAttributes().att_heater;

        // heater情報が未設定
        if(!asked_heater){
            return handlerInput.responseBuilder
                .speak('クッキングヒーターが未設定です。' + which_heater)
                .reprompt(ask_heater_message)
                .getResponse();
        }

        if(liquid_list.indexOf(ask_water) > -1){
            handlerInput.attributesManager.setSessionAttributes({'att_water': ask_water});
            return handlerInput.responseBuilder
                .speak(water_message + '茹で加減はどうしますか？')
                .reprompt(ask_water_message)
                .getResponse();
        } else {
            return handlerInput.responseBuilder
                .speak(Again_Message)
                .reprompt(which_water)
                .getResponse();
        }


    }
};

const BoiledHandle = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && request.intent.name === 'BoiledIntent';
    },
    handle(handlerInput) {
        const ask_boiled = handlerInput.requestEnvelope.request.intent.slots.Boiled.value;
        const boiled_message = ask_boiled + 'ですね。';

        const asked_heater = handlerInput.attributesManager.getSessionAttributes().att_heater;
        // heater情報が未設定(TODO: DynamoDBに入れる)
        /*
        if(!asked_heater){
            return handlerInput.responseBuilder
                .speak('クッキングヒーターが未設定です。' + which_heater)
                .reprompt(ask_heater_message)
                .getResponse();
        }
        */
        const asked_water = handlerInput.attributesManager.getSessionAttributes().att_water;
        // water情報が未設定
        if(!asked_water){
            return handlerInput.responseBuilder
                .speak('何から加熱するかが決まっていません。' + which_water)
                .reprompt(ask_water_message)
                .getResponse();
        }
        // TODO 
        return handlerInput.responseBuilder
            .speak(boiled_message + asked_water + 'から加熱するには12分かかります。「alexa、12分のタイマーをかけて。」と言ってください。')
            .getResponse();
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
};