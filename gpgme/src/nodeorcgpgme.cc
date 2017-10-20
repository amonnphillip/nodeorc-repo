#include "nodeorcgpgme.h"
#include "gpgmeasyncworker.h"

using namespace v8;

NODE_MODULE(gpgme, Gpgme::Init);

Nan::Persistent<Function> Gpgme::constructor;

void Gpgme::Init(v8::Local<v8::Object> exports, v8::Local<v8::Object> module) 
{
  Local<FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
  tpl->SetClassName(Nan::New<v8::String>("Gpgme").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // SetPrototypeMethod(tpl, "toString", toString);
  // SetPrototypeMethod(tpl, "createSignature", CreateSignature);
  SetPrototypeMethod(tpl, "deleteKey", DeleteKey);
  SetPrototypeMethod(tpl, "exportKey", ExportKey);
  SetPrototypeMethod(tpl, "listKeys", ListKeys);
  SetPrototypeMethod(tpl, "generateKeys", GenerateKeys);

  constructor.Reset(tpl->GetFunction());

  module->Set(Nan::New("exports").ToLocalChecked(), tpl->GetFunction());
}

gpgme_ctx_t Gpgme::CreateContext()
{
  gpg_error_t err;
  gpgme_engine_info_t enginfo;
  gpgme_ctx_t context;

  setlocale (LC_ALL, "");

  gpgme_check_version(NULL);

  gpgme_set_locale(NULL, LC_CTYPE, setlocale (LC_CTYPE, NULL));

  err = gpgme_engine_check_version(GPGME_PROTOCOL_OpenPGP);
  if(err != GPG_ERR_NO_ERROR) 
  {
    Nan::ThrowError("OpenGPG is not supported on your plateform.");
    return NULL;
  }

  err = gpgme_get_engine_info(&enginfo);
  if(err != GPG_ERR_NO_ERROR) 
  {
    Nan::ThrowError("Cannot get the engine information");
    return NULL;
  }

  err = gpgme_new(&context);
  if(err != GPG_ERR_NO_ERROR) 
  {
    Nan::ThrowError("Cannot create gpgme context object");
    return NULL;
  }

  err = gpgme_set_protocol(context, GPGME_PROTOCOL_OpenPGP);
  if(err != GPG_ERR_NO_ERROR) 
  {
    Nan::ThrowError("Cannot set protocol to OpenPGP");
    return NULL;
  }

  err = gpgme_ctx_set_engine_info(context, GPGME_PROTOCOL_OpenPGP, enginfo->file_name, enginfo->home_dir);
  if(err != GPG_ERR_NO_ERROR) 
  {
    Nan::ThrowError("Cannot set engine info");
    return NULL;
  }

  gpgme_set_armor(context, 1);

  return context;
}

NAN_METHOD(Gpgme::New) 
{
  Isolate* isolate = info.GetIsolate();

  if (info.IsConstructCall()) 
  {
    Gpgme *gpgme = new Gpgme();

    gpgme->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
  } 
  else 
  {
    const int argc = 0;
    Local<Function> cons = v8::Local<v8::Function>::New(isolate, constructor);
    v8::MaybeLocal<v8::Object> result = cons->NewInstance(isolate->GetCurrentContext(), argc, NULL);
    info.GetReturnValue().Set(result.ToLocalChecked());
  }
}

NAN_METHOD(Gpgme::GenerateKeys)
{
  if (info.Length() != 2) 
  {
      Nan::ThrowTypeError("Wrong number of arguments");
      return;
  }

  if (!info[0]->IsString())
  {
      Nan::ThrowTypeError("First argument must be a string");
      return;
  }

  if (!info[1]->IsFunction())
  {
    Nan::ThrowTypeError("Second argument must be a function");
    return;
  }

  std::string keyGenParams (*v8::String::Utf8Value(info[0]->ToString()));

  Nan::Callback* thecallback = new Nan::Callback(info[1].As<Function>());
  GpgmeAsyncWorker* worker = new GpgmeAsyncWorker(thecallback, [keyGenParams]() -> std::function<void(Nan::Callback*)> {
    // This method is executed in another thread
    auto context = Gpgme::CreateContext();

    gpg_error_t err;
    err = gpgme_op_genkey(context, keyGenParams.c_str(), NULL, NULL);
    if(err != GPG_ERR_NO_ERROR) 
    {
      Nan::ThrowError("Cannot generate keys");
      return NULL;
    }

    gpgme_genkey_result_t genkey_result;
    genkey_result = gpgme_op_genkey_result(context);

    std::string fingerprint = genkey_result->fpr;
    bool primaryGenerated = genkey_result->primary;
    bool subKeyGenerated = genkey_result->sub;

    gpgme_release(context);
    
    return [fingerprint, primaryGenerated, subKeyGenerated](Nan::Callback* callback) {
      // This is executed in the v8 thread

      Local<Object> ret = Nan::New<Object>();      
      ret->Set(Nan::New("fingerprint").ToLocalChecked(), Nan::New<String>(fingerprint).ToLocalChecked());
      ret->Set(Nan::New("primaryGenerated").ToLocalChecked(), primaryGenerated ? Nan::True() : Nan::False());
      ret->Set(Nan::New("subKeyGenerated").ToLocalChecked(), subKeyGenerated ? Nan::True() : Nan::False());
      
      v8::Local<v8::Value> argv[] = {
        Nan::New<v8::Value>(ret)
      };
      callback->Call(1, argv);
    };
  });

  AsyncQueueWorker(worker);
}

NAN_METHOD(Gpgme::ListKeys) 
{
  if (info.Length() != 2) 
  {
    Nan::ThrowTypeError("Wrong number of arguments");
    return;
  }

  if (!info[0]->IsString())
  {
    Nan::ThrowTypeError("First argument must be a string");
    return;
  }

  if (!info[1]->IsFunction())
  {
    Nan::ThrowTypeError("Second argument must be a function");
    return;
  }

  std::string keyListPattern (*v8::String::Utf8Value(info[0]->ToString()));

  Nan::Callback* thecallback = new Nan::Callback(info[1].As<Function>());
  GpgmeAsyncWorker* worker = new GpgmeAsyncWorker(thecallback, [keyListPattern]() -> std::function<void(Nan::Callback*)> {
    // This method is executed in another thread
    auto context = Gpgme::CreateContext();

    gpgme_key_t key;
    gpgme_error_t err;
    std::list<gpgme_key_t> keys;

    err = gpgme_set_keylist_mode(context, GPGME_KEYLIST_MODE_SIGS);
    if (err != GPG_ERR_NO_ERROR) 
    {
      Nan::ThrowError("Cannot list keys, cannot set key list mode");
      return NULL;
    }

    err = gpgme_op_keylist_start(context, keyListPattern.c_str(), 0);
    if (err != GPG_ERR_NO_ERROR) 
    {
      Nan::ThrowError("Cannot list keys");
      return NULL;
    }

    err = gpgme_op_keylist_next(context, &key);
    if (err == GPG_ERR_NO_ERROR) 
    {
      do 
      {
        err = gpgme_op_keylist_next(context, &key);      
        if(err == GPG_ERR_NO_ERROR) 
        {
          keys.insert(keys.end(), key);      
        }
      } while (err == GPG_ERR_NO_ERROR);

      if(gpg_err_code(err) != GPG_ERR_EOF) 
      {
        Nan::ThrowError("Critical issue listing keys");
        return NULL;
      }
    }

    gpgme_release(context);

    return [keys](Nan::Callback* callback) {
      // This is executed in the v8 thread

      Local<Array> v8Keys = Nan::New<Array>();
      std::list<gpgme_key_t>::const_iterator iterator;
      int i;
      for (i = 0, iterator = keys.begin(); iterator != keys.end(); ++iterator, ++i) 
      {
        Local<Object> v8Key = Nan::New<Object>();
    
        if ((*iterator)->subkeys->fpr) 
        {
          v8Key->Set(Nan::New("fingerprint").ToLocalChecked(), Nan::New<String>((*iterator)->subkeys->fpr).ToLocalChecked());
        }
    
        if ((*iterator)->uids->email) 
        {
          v8Key->Set(Nan::New("email").ToLocalChecked(), Nan::New<String>((*iterator)->uids->email).ToLocalChecked());
        }
    
        if ((*iterator)->uids->name) 
        {
          v8Key->Set(Nan::New("name").ToLocalChecked(), Nan::New<String>((*iterator)->uids->name).ToLocalChecked());
        }
    
        if ((*iterator)->uids->signatures &&
          (*iterator)->uids->signatures->keyid) 
        {
          v8Key->Set(Nan::New("signature").ToLocalChecked(), Nan::New<String>((*iterator)->uids->signatures->keyid).ToLocalChecked());
        }
    
        if ((*iterator)->uids->signatures &&
        (*iterator)->uids->signatures->timestamp) 
        {
          v8Key->Set(Nan::New("timestamp").ToLocalChecked(), Nan::New<String>(std::to_string((*iterator)->uids->signatures->timestamp)).ToLocalChecked());
        }
    
        v8Key->Set(Nan::New("revoked").ToLocalChecked(), (*iterator)->revoked ? Nan::True() : Nan::False());
        v8Key->Set(Nan::New("expired").ToLocalChecked(), (*iterator)->revoked ? Nan::True() : Nan::False());
        v8Key->Set(Nan::New("disabled").ToLocalChecked(), (*iterator)->disabled ? Nan::True() : Nan::False());
        v8Key->Set(Nan::New("invalid").ToLocalChecked(), (*iterator)->invalid ? Nan::True() : Nan::False());
        v8Key->Set(Nan::New("can_encrypt").ToLocalChecked(), (*iterator)->can_encrypt ? Nan::True() : Nan::False());
        v8Keys->Set(i, v8Key);
        v8Key->Set(Nan::New("secret").ToLocalChecked(), (*iterator)->secret ? Nan::True() : Nan::False());
        v8Keys->Set(i, v8Key);
        gpgme_key_unref((*iterator));
      }
    
      v8::Local<v8::Value> argv[] = {
        Nan::New<v8::Value>(v8Keys)
      };
      callback->Call(1, argv);
    };
  });

  AsyncQueueWorker(worker);
}

NAN_METHOD(Gpgme::ExportKey) 
{
  if (info.Length() != 2) 
  {
    Nan::ThrowTypeError("Wrong number of arguments");
    return;
  }

  if (!info[0]->IsString())
  {
    Nan::ThrowTypeError("First argument must be a string");
    return;
  }

  if (!info[1]->IsFunction())
  {
    Nan::ThrowTypeError("Second argument must be a function");
    return;
  }

  std::string keyFindPattern (*v8::String::Utf8Value(info[0]->ToString()));

  Nan::Callback* thecallback = new Nan::Callback(info[1].As<Function>());
  GpgmeAsyncWorker* worker = new GpgmeAsyncWorker(thecallback, [keyFindPattern]() -> std::function<void(Nan::Callback*)> {
    // This method is executed in another thread
    auto context = Gpgme::CreateContext();

    gpgme_data_t data;
    ssize_t dataSize;
    gpgme_error_t err;
    char* stringBuffer = NULL;

    err = gpgme_data_new(&data);
    if(err != GPG_ERR_NO_ERROR) 
    {
      Nan::ThrowError("Cannot export key");
      return NULL;
    }

    err = gpgme_data_set_encoding(data,GPGME_DATA_ENCODING_ARMOR);
    if(err != GPG_ERR_NO_ERROR) 
    {
      Nan::ThrowError("Cannot export key");
      return NULL;
    }

    err = gpgme_op_export(context, keyFindPattern.c_str(), 0, data);
    if(err != GPG_ERR_NO_ERROR) 
    {
      Nan::ThrowError("Cannot export key");
      return NULL;
    }

    dataSize = gpgme_data_seek(data, 0, SEEK_END);
    if (dataSize == -1) 
    {
      Nan::ThrowError("Cannot export key");
      return NULL;
    }
    gpgme_data_seek(data, 0, SEEK_SET);
    
    stringBuffer = new char[dataSize + 1];
    if (stringBuffer == NULL) 
    {
      gpgme_data_release(data);
      Nan::ThrowError("Cannot export key, out of memory");
      return NULL;
    }
    memset(stringBuffer, 0, dataSize + 1);

    ssize_t bytesWritten = gpgme_data_read(data, stringBuffer, dataSize);
    if (bytesWritten != dataSize) 
    {
      delete stringBuffer;
      gpgme_data_release(data);
      Nan::ThrowError("Cannot export key");
      return NULL;
    }

    std::string exportedKey = stringBuffer;
    
    delete stringBuffer;
    gpgme_data_release(data);

    gpgme_release(context);
    
    return [exportedKey](Nan::Callback* callback) {
      // This is executed in the v8 thread
      v8::Local<v8::Value> argv[] = {
        Nan::New<v8::String>(exportedKey).ToLocalChecked()
      };
      callback->Call(1, argv);
    };
  });

  AsyncQueueWorker(worker);
}

NAN_METHOD(Gpgme::DeleteKey) 
{
  if (info.Length() != 3) 
  {
    Nan::ThrowTypeError("Wrong number of arguments");
    return;
  }

  if (!info[0]->IsString())
  {
    Nan::ThrowTypeError("First argument must be a string");
    return;
  }

  if (!info[1]->IsString())
  {
    Nan::ThrowTypeError("Second argument must be a string");
    return;
  }

  if (!info[2]->IsFunction())
  {
    Nan::ThrowTypeError("Third argument must be a function");
    return;
  }
  
  std::string keyFingerprint (*v8::String::Utf8Value(info[0]->ToString()));
  std::string passphrase (*v8::String::Utf8Value(info[1]->ToString()));
  
  Nan::Callback* thecallback = new Nan::Callback(info[2].As<Function>());
  GpgmeAsyncWorker* worker = new GpgmeAsyncWorker(thecallback, [keyFingerprint, passphrase]() -> std::function<void(Nan::Callback*)> {
    // This method is executed in another thread
    auto context = Gpgme::CreateContext();
    
    bool keyDeleted = false;
    gpgme_key_t key;
    gpgme_error_t err;

    gpgme_set_passphrase_cb(context, [](void* hook, const char*uid_hint, const char*passphrase_info, int prev_was_bad, int fd) -> gpgme_error_t {
      if (prev_was_bad)
      {
        return GPG_ERR_CANCELED;
      }

      const char* pw = reinterpret_cast<const char*>(hook);
      gpgme_io_writen(fd, hook, std::strlen(pw));
      gpgme_io_writen(fd, "\n", 1);
      
      return 0;
    }, reinterpret_cast<void*>(const_cast<char*>(passphrase.c_str())));
    
    err = gpgme_get_key(context, keyFingerprint.c_str(), &key, 0);
    if(gpg_err_code(err) != GPG_ERR_EOF)
    {
      err = gpgme_op_delete_ext(context, key, GPGME_DELETE_FORCE);
      if (err == GPG_ERR_NO_ERROR)
      {
        keyDeleted = true;
      }
    }
    
    gpgme_release(context);

    return [keyDeleted](Nan::Callback* callback) {
      // This is executed in the v8 thread
      v8::Local<v8::Value> argv[] = {
        Nan::New<v8::Boolean>(keyDeleted)
      };
      callback->Call(1, argv);
    };
  });

  AsyncQueueWorker(worker);
}