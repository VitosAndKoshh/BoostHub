using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Migrations.Migrations
{
    /// <inheritdoc />
    public partial class ChangeBoosterApplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_booster_applications_game_platform_accounts_verification_ga~",
                table: "booster_applications");

            migrationBuilder.DropIndex(
                name: "IX_boosters_account_id",
                table: "boosters");

            migrationBuilder.DropIndex(
                name: "IX_booster_applications_verification_game_platform_account_id",
                table: "booster_applications");

            migrationBuilder.DropColumn(
                name: "verification_game_platform_account_id",
                table: "booster_applications");

            migrationBuilder.CreateIndex(
                name: "IX_boosters_account_id",
                table: "boosters",
                column: "account_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_boosters_account_id",
                table: "boosters");

            migrationBuilder.AddColumn<Guid>(
                name: "verification_game_platform_account_id",
                table: "booster_applications",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_boosters_account_id",
                table: "boosters",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "IX_booster_applications_verification_game_platform_account_id",
                table: "booster_applications",
                column: "verification_game_platform_account_id");

            migrationBuilder.AddForeignKey(
                name: "FK_booster_applications_game_platform_accounts_verification_ga~",
                table: "booster_applications",
                column: "verification_game_platform_account_id",
                principalTable: "game_platform_accounts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
