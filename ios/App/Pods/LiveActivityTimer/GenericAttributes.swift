import Foundation
import ActivityKit
import SwiftUI

struct GenericAttributes: ActivityAttributes {
    public typealias ContentState = State

    public struct State: Codable, Hashable {
        var values: [String: String]
    }

    var id: String
    var staticValues: [String: String]
} 
