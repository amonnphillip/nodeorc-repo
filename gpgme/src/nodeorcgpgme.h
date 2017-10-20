#ifndef NODEORCGPGME_H
#define NODEORCGPGME_H

#include <string>
#include <stdlib.h>
#include <list>
#include <nan.h>
#include <node.h>
#include <gpgme.h>

#if (!defined(GPGME_VERSION_NUMBER) || (GPGME_VERSION_NUMBER < 0x010a00))
#error "You need to build against Gpgme version 1.9.0 or greater"
#endif

using namespace Nan;

class Gpgme : public ObjectWrap {

 private:

  static gpgme_ctx_t CreateContext();
  // char* getVersion();
  // bool addKey(char *key, int length, std::string& fingerprint);
  // bool getKeys(std::list<gpgme_key_t> *keys);
  // char *cipherPayload(v8::Local<v8::String> fpr, v8::Local<v8::String> msg);
  // char *StringToCharPointer(v8::Local<v8::String> str);
  // bool generateKeys(v8::Local<v8::String> str);

  static NAN_METHOD(New);
  // static NAN_METHOD(toString);
  // static NAN_METHOD(importKey);
  static NAN_METHOD(ListKeys);
  static NAN_METHOD(ExportKey);
  static NAN_METHOD(DeleteKey);
  // static NAN_METHOD(cipher);
  static NAN_METHOD(GenerateKeys);

 public:
  static Nan::Persistent<v8::Function> constructor;

  //static NAN_MODULE_INIT(Init);
  static void Init(v8::Local<v8::Object> exports, v8::Local<v8::Object> module);
};

#endif