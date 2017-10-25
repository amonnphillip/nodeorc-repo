#ifndef NODEORCGPGMEASYNCWORKER_H
#define NODEORCGPGMEASYNCWORKER_H

#include <string>
#include <stdlib.h>
#include <functional>
#include <list>
#include <nan.h>
#include <node.h>
#include <gpgme.h>

using namespace Nan;

class GpgmeAsyncWorker : public AsyncWorker {
public:
  GpgmeAsyncWorker(
    Callback* callback, 
    std::function<std::function<void(Nan::Callback*)>()> asyncFunction) :
    AsyncWorker(callback),
    threadedAsyncFunc(asyncFunction) {}

  // This method is executed in a thread other than the v8 engine
  void Execute()
  {
    callbackFunc = threadedAsyncFunc(); 
  };
  
  // This method is executed in the v8 engine thread
  virtual void HandleOKCallback()
  {
    callbackFunc(callback);
  }

  std::function<std::function<void(Nan::Callback*)>()> threadedAsyncFunc;
  std::function<void(Nan::Callback*)> callbackFunc;
};

#endif