import Foundation
import Vision
import AppKit

guard CommandLine.arguments.count >= 2 else {
    fputs("usage: swift ocr_apple_vision.swift <image-path> [--json]\n", stderr)
    exit(1)
}

let path = CommandLine.arguments[1]
let outputJSON = CommandLine.arguments.dropFirst(2).contains("--json")
let url = URL(fileURLWithPath: path)

guard let image = NSImage(contentsOf: url) else {
    fputs("cannot load image\n", stderr)
    exit(1)
}

guard let tiff = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let cgImage = bitmap.cgImage else {
    fputs("cannot build cgimage\n", stderr)
    exit(1)
}

let request = VNRecognizeTextRequest()
request.recognitionLanguages = ["zh-Hans", "en-US"]
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
try handler.perform([request])

let results = request.results ?? []
if outputJSON {
    struct OCRBox: Encodable {
        let text: String
        let x: Double
        let y: Double
        let w: Double
        let h: Double
    }

    let boxes: [OCRBox] = results.compactMap { obs in
        guard let top = obs.topCandidates(1).first else { return nil }
        let box = obs.boundingBox
        return OCRBox(
            text: top.string,
            x: Double(box.origin.x),
            y: Double(1.0 - box.origin.y - box.size.height),
            w: Double(box.size.width),
            h: Double(box.size.height)
        )
    }

    let payload: [String: Any] = [
        "width": cgImage.width,
        "height": cgImage.height,
        "items": boxes.map { [
            "text": $0.text,
            "x": $0.x,
            "y": $0.y,
            "w": $0.w,
            "h": $0.h,
        ] }
    ]
    let data = try JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys])
    if let json = String(data: data, encoding: .utf8) {
        print(json)
    }
} else {
    for obs in results {
        if let top = obs.topCandidates(1).first {
            print(top.string)
        }
    }
}
