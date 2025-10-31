package com.pal_pan

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class DocumentPickerPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == DocumentPickerModule::class.java.simpleName) {
            DocumentPickerModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
            val isTurboModule = false
            moduleInfos[DocumentPickerModule::class.java.simpleName] = ReactModuleInfo(
                DocumentPickerModule::class.java.simpleName,
                DocumentPickerModule::class.java.name,
                false,  // canOverrideExistingModule
                false,  // needsEagerInit
                false,  // hasConstants
                false,  // isCxxModule
                isTurboModule // isTurboModule
            )
            moduleInfos
        }
    }
}
