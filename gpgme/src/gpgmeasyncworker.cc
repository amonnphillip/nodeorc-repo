#include "gpgmeasyncworker.h"

#if 0
template<typename ...Args>
void GpgmeAsyncWorker::Execute() 
{
  gpgme_ctx_t context = CreateContext();
  if (context != NULL) 
  {
    func(context); 
    gpgme_release(context);
  }  
}

template<typename ...Args>
void GpgmeAsyncWorker::HandleOKCallback()
{
  callbackFunc(callback);
}

template<typename ...Args>
gpgme_ctx_t GpgmeAsyncWorker::CreateContext()
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
  #endif