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
public:
  Gpgme(std::string homeDir);
  static Nan::Persistent<v8::Function> constructor;
  static void Init(v8::Local<v8::Object> exports, v8::Local<v8::Object> module);

 private:
  static gpgme_ctx_t CreateContext(std::string homeDir);
  static NAN_METHOD(New);
  static NAN_METHOD(CreateDetachedSignature);
  static NAN_METHOD(ListKeys);
  static NAN_METHOD(ExportKey);
  static NAN_METHOD(DeleteKey);
  static NAN_METHOD(GenerateKeys);

  std::string homeDir;
};

#endif