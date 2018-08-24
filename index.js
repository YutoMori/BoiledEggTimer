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

const boiled_list = [
    'パサパサ',
    '固め',
    '白っぽい',
    '味玉用',
    'やや固め',
    '白身固め',
    '色鮮やか',
    'お弁当用',
    '食べ慣れているもの',
    'ノーマル',
    '中心がしっかり',
    'オススメ',
    '卵サンド用',
    '凝縮',
    '半々',
    'やや半熟',
    '黄身だけ半熟',
    'やわらか白身',
    '半熟',
    'トロトロ',
    '超半熟',
    'じゅくじゅく'
]

// 茹で時間
function boiled_time(boiled) {
    switch (boiled) {
        case 'パサパサ':
            return 13;

        case '固め':
        case '白っぽい':
            return 12;

        case '味玉用':
        case 'やや固め':
            return 11;

        case '白身固め':
        case '色鮮やか':
        case 'お弁当用':
        case '食べ慣れているもの':
            return 10;

        case 'ノーマル':
        case '中心がしっかり':
            return 9;

        case 'オススメ':
        case '卵サンド用':
            return 8;

        case '凝縮':
        case '半々':
        case 'やや半熟':
            return 7;

        case '黄身だけ半熟':
        case 'やわらか白身':
        case '半熟':
            return 6;
        
        case 'トロトロ':
            return 5;

        case '超半熟':
        case 'じゅくじゅく':
            return 4;
    }
}

let skill;
exports.handler = async function (event, context) {
    if (!skill) {
      skill = Alexa.SkillBuilders.standard()
        .addRequestHandlers(
            HelpIntentHandler,
            LaunchRequestHandler,
            CookingHeaterHandler,
            WaterHandler,
            BoiledHandle,
            StopIntentHandler,
            SessionEndedRequestHandler,
            ErrorHandler
        )
        .withTableName("HeaterTable")   // テーブル名を決定
        .withAutoCreateTable(true)      // テーブル作成をスキルから行う
        .create();
    }
    return skill.invoke(event);
};

const HelpIntentHandler = {
    canHandle(handlerInput){
        const request = handlerInput.requestEnvelope.request;

        return  request.type === 'IntentRequest'
        &&      request.intent.name === 'AMAZON.HelpIntent';
    },

    handle(handlerInput) {

        const LaunchSpeech = 'ゆで卵の茹で加減に応じて、茹で時間を教えるスキルです。';
        const StopSpeech = 'やめたいときはストップかキャンセルと言ってください。';
        const OneMoreSpeech = 'もう一度、最初の質問から始めます。';

        const speech = LaunchSpeech + StopSpeech + OneMoreSpeech + which_heater;

        return handlerInput.responseBuilder
            .speak(speech)
            .reprompt(ask_heater_message)
            .getResponse();
    }
};



const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest';
    },

    async handle(handlerInput) {
        const launch_message = '一緒に美味しいゆで卵を作りましょう。';

        var persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

        // heater情報が未設定
        if(!(persistentAttributes.key == 'ガス' || persistentAttributes.key == 'アイエイチ')){
            return handlerInput.responseBuilder
            .speak(launch_message + which_heater)
            .reprompt(ask_heater_message)
            .getResponse();
        } else { // heater情報がdynamoDBに保存されている
            return handlerInput.responseBuilder
            .speak(launch_message + which_water)
            .reprompt(ask_water_message)
            .getResponse();
        }
    }
};

const CookingHeaterHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest'
            && request.intent.name === 'CookingHeaterIntent');
    },
    async handle(handlerInput) {
        const ask_heater = handlerInput.requestEnvelope.request.intent.slots.Heater.value;
        const heater_message = ask_heater + 'ですね。';

        // dynamoDBからheater情報を取得
        var persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

        if(heater_list.indexOf(ask_heater) > -1){
            
            persistentAttributes = {
                "key" : ask_heater
            }

            // dynamoDBへheater情報を保存
            handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
            await handlerInput.attributesManager.savePersistentAttributes();
            
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
    async handle(handlerInput) {
        const ask_water = handlerInput.requestEnvelope.request.intent.slots.Liquid.value;
        const water_message = ask_water + 'ですね。';
        var persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

        // heater情報が未設定
        if(!(persistentAttributes.key == 'ガス' || persistentAttributes.key == 'アイエイチ')){
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
    async handle(handlerInput) {
        const ask_boiled = handlerInput.requestEnvelope.request.intent.slots.Boiled.value;
        const boiled_message = ask_boiled + 'ですね。';

        var persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
        // heater情報が未設定
        if(!(persistentAttributes.key == 'ガス' || persistentAttributes.key == 'アイエイチ')){
            return handlerInput.responseBuilder
                .speak('クッキングヒーターが未設定です。' + which_heater)
                .reprompt(ask_heater_message)
                .getResponse();
        }

        const asked_water = handlerInput.attributesManager.getSessionAttributes().att_water;
        // water情報が未設定
        if(!asked_water){
            return handlerInput.responseBuilder
                .speak('何から加熱するかが決まっていません。' + which_water)
                .reprompt(ask_water_message)
                .getResponse();
        }

        var boiled_t = boiled_time(ask_boiled)
        if (persistentAttributes.key == 'アイエイチ'){
            boiled_t++;
        }
        if (asked_water == '水'){
            boiled_t++;
        }

        if (boiled_list.indexOf(ask_boiled) > -1){
            return handlerInput.responseBuilder
                .speak(boiled_message + asked_water + 'から加熱するには' + boiled_t 
                + '分かかります。「alexa、'+ boiled_t +'分のタイマーをかけて。」と言ってください。')
                .getResponse();
        } else {
            return handlerInput.responseBuilder
                .speak(Again_Message)
                .reprompt('茹で加減はどうしますか？')
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
};