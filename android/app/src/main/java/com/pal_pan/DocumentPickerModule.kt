package com.pal_pan

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResultLauncher
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class DocumentPickerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DocumentPickerModule"
    }

    private var pickFilePromise: Promise? = null

    @ReactMethod
    fun pickPDF(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity doesn't exist")
            return
        }

        pickFilePromise = promise

        try {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "application/pdf"
            }

            @Suppress("DEPRECATION")
            activity.startActivityForResult(intent, PICK_PDF_REQUEST)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
            pickFilePromise = null
        }
    }

    fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == PICK_PDF_REQUEST && pickFilePromise != null) {
            if (resultCode == Activity.RESULT_OK) {
                data?.data?.let { uri ->
                    try {
                        val result = getFileInfo(uri)
                        pickFilePromise?.resolve(result)
                    } catch (e: Exception) {
                        pickFilePromise?.reject("ERROR", e.message)
                    }
                } ?: pickFilePromise?.reject("NO_FILE", "No file selected")
            } else {
                pickFilePromise?.reject("CANCELLED", "User cancelled")
            }
            pickFilePromise = null
        }
    }

    private fun getFileInfo(uri: Uri): WritableMap {
        val context = reactApplicationContext
        val result = Arguments.createMap()

        try {
            // Get file name
            var fileName = "document.pdf"
            var fileSize: Long = 0

            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                    val sizeIndex = cursor.getColumnIndex(android.provider.OpenableColumns.SIZE)

                    if (nameIndex >= 0) {
                        fileName = cursor.getString(nameIndex) ?: "document.pdf"
                    }
                    if (sizeIndex >= 0) {
                        fileSize = cursor.getLong(sizeIndex)
                    }
                }
            }

            // Copy file to cache directory
            val cacheDir = context.cacheDir
            val cacheFile = java.io.File(cacheDir, "temp_${System.currentTimeMillis()}_$fileName")

            context.contentResolver.openInputStream(uri)?.use { input ->
                cacheFile.outputStream().use { output ->
                    input.copyTo(output)
                }
            }

            result.putString("uri", "file://${cacheFile.absolutePath}")
            result.putString("fileCopyUri", cacheFile.absolutePath)
            result.putString("name", fileName)
            result.putDouble("size", fileSize.toDouble())
            result.putString("type", "application/pdf")

        } catch (e: Exception) {
            throw e
        }

        return result
    }

    companion object {
        const val PICK_PDF_REQUEST = 1001
    }
}
